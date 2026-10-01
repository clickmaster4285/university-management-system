import mongoose from 'mongoose';
import { handle } from '../utils/asyncHandler.js';
import {
  Batch,
  Campus,
  Department,
  Program,
  Student,
  StudentAdmission,
  StudentApplication,
  StudentDocument,
} from '../models/index.js';
import { generateStudentId } from '../utils/generateStudentId.js';
import { ensureStudentPortalAccount } from '../utils/studentPortalAccount.js';
import { STUDENT_DOCUMENT_TYPES } from '../utils/uploadPaths.js';
import {
  ensureAdmissionFeeChallan,
  getAdmissionFeeForDossier,
  isAdmissionFeeSatisfied,
  buildAdmissionChallanPrintView,
} from '../utils/admissionFeeChallan.js';

const notDeleted = { $ne: true };

const normalizeRefId = (value) => {
  if (value == null || value === '') return value;
  if (typeof value === 'object') return value._id || value;
  return value;
};

export const REQUIRED_DOSSIER_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'cnic',
  'dateOfBirth',
  'gender',
  'programId',
  'campusId',
  'batchId',
];

export const REQUIRED_DOCUMENT_TYPES = [];

function populateDossier(query) {
  return query
    .populate('applicationId', 'applicationId status source')
    .populate('programId', 'name code degreeLevel')
    .populate('departmentId', 'name code')
    .populate('campusId', 'name campusCode')
    .populate('batchId', 'name code')
    .populate('academicSessionId', 'name code')
    .populate('studentId', 'studentId firstName lastName status')
    .populate('admissionOfficer', 'firstName lastName email');
}

async function findDossier(identifier) {
  const query = [{ admissionId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return StudentAdmission.findOne({ $or: query, isDeleted: notDeleted });
}

export const listDossiers = handle(async (req, res) => {
  const { status, programId, search, page = 1, limit = 50 } = req.query;
  const filter = { isDeleted: notDeleted };

  if (status) filter.status = status;
  if (programId) filter.programId = programId;

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { cnic: { $regex: search, $options: 'i' } },
      { admissionId: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [data, total] = await Promise.all([
    populateDossier(
      StudentAdmission.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(parseInt(limit, 10))
    ),
    StudentAdmission.countDocuments(filter),
  ]);

  res.json({ success: true, count: data.length, total, data });
});

export const getDossierById = handle(async (req, res) => {
  const dossier = await findDossier(req.params.id);
  if (!dossier) {
    return res.status(404).json({ success: false, message: 'Admission dossier not found' });
  }
  const populated = await populateDossier(StudentAdmission.findById(dossier._id));
  res.json({ success: true, data: populated });
});

export const updateDossier = handle(async (req, res) => {
  const dossier = await findDossier(req.params.id);
  if (!dossier) {
    return res.status(404).json({ success: false, message: 'Admission dossier not found' });
  }

  if (dossier.status === 'Enrolled') {
    return res.status(400).json({
      success: false,
      message: 'Enrolled dossiers cannot be edited',
    });
  }

  const allowed = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'cnic',
    'dateOfBirth',
    'gender',
    'nationality',
    'religion',
    'programId',
    'departmentId',
    'campusId',
    'batchId',
    'academicSessionId',
    'guardian',
    'address',
    'previousEducation',
    'status',
    'interviewDate',
    'decisionDate',
    'remarks',
    'rejectionReason',
    'admissionOfficer',
  ];

  const refFields = ['programId', 'departmentId', 'campusId', 'batchId', 'academicSessionId'];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      dossier[key] = refFields.includes(key) ? normalizeRefId(req.body[key]) : req.body[key];
    }
  }

  const programId = normalizeRefId(req.body.programId ?? dossier.programId);
  if (programId) {
    const program = await Program.findById(programId);
    if (program?.departmentId) {
      dossier.departmentId = program.departmentId;
    }
  }

  await dossier.save();
  const populated = await populateDossier(StudentAdmission.findById(dossier._id));
  res.json({ success: true, data: populated });
});

export const completeAdmission = handle(async (req, res) => {
  const dossier = await findDossier(req.params.id);
  if (!dossier) {
    return res.status(404).json({ success: false, message: 'Admission dossier not found' });
  }

  if (dossier.studentId) {
    const existing = await Student.findById(dossier.studentId);
    return res.json({
      success: true,
      data: existing,
      message: 'Student record already exists for this dossier',
    });
  }

  const missingFields = REQUIRED_DOSSIER_FIELDS.filter((field) => {
    const value = dossier[field];
    return value === undefined || value === null || value === '';
  });

  if (!dossier.guardian?.fatherName) {
    missingFields.push('guardian.fatherName');
  }
  if (!dossier.address?.city) {
    missingFields.push('address.city');
  }

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Admission dossier is incomplete',
      missingFields,
    });
  }

  const documents = await StudentDocument.find({
    studentAdmission: dossier._id,
    isDeleted: notDeleted,
  });

  const uploadedTypes = new Set(documents.map((doc) => doc.documentType));
  const missingDocs = REQUIRED_DOCUMENT_TYPES.filter((type) => !uploadedTypes.has(type));

  if (missingDocs.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Required documents are missing',
      missingDocuments: missingDocs,
    });
  }

  const [program, department, campus, batch] = await Promise.all([
    Program.findById(dossier.programId),
    dossier.departmentId ? Department.findById(dossier.departmentId) : null,
    Campus.findById(dossier.campusId),
    dossier.batchId ? Batch.findById(dossier.batchId) : null,
  ]);

  const admissionFee = await getAdmissionFeeForDossier(
    dossier._id,
    dossier.applicationId || null
  );
  if (!isAdmissionFeeSatisfied(admissionFee, program?.admissionFee)) {
    return res.status(400).json({
      success: false,
      message:
        'Admission fee must be verified (or waived) before creating the student record',
      admissionFee: admissionFee
        ? {
            feeId: admissionFee.feeId,
            amount: admissionFee.amount,
            paymentStatus: admissionFee.paymentStatus,
            proofStatus: admissionFee.proofStatus,
          }
        : null,
    });
  }

  const studentId = await generateStudentId();
  const student = await Student.create({
    studentId,
    admissionId: dossier._id,
    firstName: dossier.firstName,
    lastName: dossier.lastName,
    name: `${dossier.firstName} ${dossier.lastName}`.trim(),
    fatherName: dossier.guardian?.fatherName || '',
    motherName: dossier.guardian?.motherName || '',
    cnic: dossier.cnic,
    email: dossier.email,
    phone: dossier.phone,
    programId: dossier.programId,
    departmentId: dossier.departmentId,
    campusId: dossier.campusId,
    batchId: dossier.batchId,
    program: program?.name || '',
    department: department?.name || '',
    campus: campus?.name || '',
    city: dossier.address?.city || '',
    status: 'Active',
    enrollmentDate: new Date(),
    currentSemester: 1,
    semester: 1,
  });

  // Link admission fee challan to the new student when present
  if (admissionFee) {
    admissionFee.studentId = student.studentId;
    admissionFee.studentName = student.name;
    admissionFee.studentEmail = student.email;
    await admissionFee.save();
  }

  dossier.studentId = student._id;
  dossier.status = 'Enrolled';
  dossier.decisionDate = dossier.decisionDate || new Date();
  await dossier.save();

  await StudentDocument.updateMany(
    { studentAdmission: dossier._id, isDeleted: notDeleted },
    { $set: { student: student._id } }
  );

  const application = await StudentApplication.findById(dossier.applicationId);
  if (application) {
    application.status = 'Promoted';
    await application.save();
  }

  const portalResult = await ensureStudentPortalAccount(student);
  if (portalResult.error) {
    console.warn('[completeAdmission] portal account:', portalResult.error);
  }

  const populated = await Student.findById(student._id)
    .populate('programId', 'name code')
    .populate('departmentId', 'name code')
    .populate('campusId', 'name campusCode')
    .populate('batchId', 'name code')
    .populate('admissionId', 'admissionId status');

  res.status(201).json({
    success: true,
    data: populated,
    portalLogin: portalResult.portalLogin,
    message: portalResult.portalLogin?.temporaryPassword
      ? `Student ${studentId} created. Portal login credentials shown once — save them now.`
      : `Student ${studentId} created successfully`,
  });
});

export const getDossierDocumentTypes = handle(async (_req, res) => {
  res.json({
    success: true,
    data: {
      all: STUDENT_DOCUMENT_TYPES,
      required: REQUIRED_DOCUMENT_TYPES,
    },
  });
});

export const getDossierAdmissionFee = handle(async (req, res) => {
  const dossier = await findDossier(req.params.id);
  if (!dossier) {
    return res.status(404).json({ success: false, message: 'Admission dossier not found' });
  }
  const fee = await getAdmissionFeeForDossier(dossier._id, dossier.applicationId || null);
  const program = await Program.findById(dossier.programId).select('admissionFee name code');
  let printChallan = null;
  if (fee && dossier.applicationId) {
    const application =
      (await StudentApplication.findById(dossier.applicationId)) ||
      ({
        applicationId: dossier.admissionId,
        firstName: dossier.firstName,
        lastName: dossier.lastName,
        email: dossier.email,
        phone: dossier.phone,
        cnic: dossier.cnic,
        guardian: dossier.guardian,
        programId: dossier.programId,
        campusId: dossier.campusId,
      });
    printChallan = await buildAdmissionChallanPrintView(fee, application);
  }
  res.json({
    success: true,
    data: fee,
    printChallan,
    programAdmissionFee: program?.admissionFee ?? 0,
    satisfied: isAdmissionFeeSatisfied(fee, program?.admissionFee),
  });
});

export const verifyDossierAdmissionFee = handle(async (req, res) => {
  const dossier = await findDossier(req.params.id);
  if (!dossier) {
    return res.status(404).json({ success: false, message: 'Admission dossier not found' });
  }

  let fee = await getAdmissionFeeForDossier(dossier._id, dossier.applicationId || null);
  if (!fee && dossier.applicationId) {
    const application = await StudentApplication.findById(dossier.applicationId);
    if (application) {
      const created = await ensureAdmissionFeeChallan(application, { dossierId: dossier._id });
      fee = created.fee;
    }
  }
  if (!fee) {
    const program = await Program.findById(dossier.programId).select('admissionFee');
    if (program && Number(program.admissionFee) <= 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No admission fee configured on this program',
        satisfied: true,
      });
    }
    return res.status(400).json({
      success: false,
      message: 'No admission fee challan found — accept/promote the application first',
    });
  }

  const { markPaid = true, transactionId, notes, proofStatus, paymentMethod } = req.body;
  fee.proofStatus = proofStatus || 'Verified';
  if (notes !== undefined) fee.proofNotes = notes;
  if (transactionId) fee.transactionId = transactionId;
  if (markPaid) {
    fee.paidAmount = fee.amount;
    fee.remainingAmount = 0;
    fee.paymentStatus = 'Paid';
    fee.paidDate = new Date();
    fee.paymentMethod = paymentMethod || 'Bank Transfer';
  }
  if (!fee.studentAdmissionId) fee.studentAdmissionId = dossier._id;
  await fee.save();

  res.json({
    success: true,
    data: fee,
    satisfied: true,
    message: `Admission fee ${fee.feeId} verified${markPaid ? ' and marked paid' : ''}.`,
  });
});
