import { handle } from '../utils/asyncHandler.js';
import {
  AcademicSession,
  Campus,
  Department,
  Program,
  StudentApplication,
  StudentDocument,
  University,
} from '../models/index.js';
import { generateApplicationId } from '../utils/generateStudentId.js';
import { parseApplicationExtendedFields } from '../utils/applicationFields.js';
import {
  formatAdmissionWindowLabel,
  groupProgramsByCategory,
  isProgramAdmissionOpen,
} from '../utils/programAdmission.js';

const notDeleted = { $ne: true };

const normalizeCnic = (value) => String(value || '').replace(/\D/g, '');

function serializePublicProgram(program, now = new Date()) {
  const dept =
    program.departmentId && typeof program.departmentId === 'object'
      ? {
          _id: program.departmentId._id,
          name: program.departmentId.name,
          code: program.departmentId.code,
        }
      : null;
  const { label, open } = formatAdmissionWindowLabel(program, now);

  return {
    _id: program._id,
    name: program.name,
    code: program.code,
    degreeLevel: program.degreeLevel,
    duration: program.duration,
    totalCredits: program.totalCredits ?? 0,
    description: program.description || '',
    department: dept,
    admissionOpensAt: program.admissionOpensAt || null,
    admissionClosesAt: program.admissionClosesAt || null,
    admissionOpen: open,
    admissionLabel: label,
  };
}

async function findPublicApplicationByIdAndCnic(applicationId, cnic) {
  const application = await StudentApplication.findOne({
    applicationId: String(applicationId || '').trim(),
    isDeleted: notDeleted,
  });
  if (!application || normalizeCnic(cnic) !== normalizeCnic(application.cnic)) {
    return null;
  }
  return application;
}

function serializeTrackApplication(application, documents) {
  const latestByType = new Map();
  for (const doc of documents) {
    if (!latestByType.has(doc.documentType)) {
      latestByType.set(doc.documentType, doc);
    }
  }

  const canEdit = ['Action Required', 'Submitted', 'Under Review'].includes(application.status);

  return {
    _id: application._id,
    applicationId: application.applicationId,
    fullName: application.fullName,
    status: application.status,
    applicantMessage: application.applicantMessage || '',
    applicantReply: application.applicantReply || '',
    canEdit,
    firstName: application.firstName,
    lastName: application.lastName,
    email: application.email,
    phone: application.phone,
    cnic: application.cnic,
    dateOfBirth: application.dateOfBirth,
    gender: application.gender,
    nationality: application.nationality,
    religion: application.religion,
    programId: application.programId,
    campusId: application.campusId,
    academicSessionId: application.academicSessionId,
    guardian: application.guardian,
    address: application.address,
    previousDegree: application.previousDegree,
    previousMarks: application.previousMarks,
    previousEducation: application.previousEducation,
    submittedAt: application.submittedAt,
    updatedAt: application.updatedAt,
    documents: Array.from(latestByType.values()),
  };
}

export const getPublicPrograms = handle(async (_req, res) => {
  const now = new Date();
  const programs = await Program.find({ isDeleted: notDeleted, status: 'Active' })
    .populate('departmentId', 'name code')
    .select(
      'name code degreeLevel duration totalCredits description departmentId admissionOpensAt admissionClosesAt status'
    )
    .sort({ name: 1 });

  res.json({
    success: true,
    data: programs.map((p) => serializePublicProgram(p, now)),
  });
});

export const getPublicCampuses = handle(async (_req, res) => {
  const campuses = await Campus.find({ isDeleted: notDeleted, status: 'Active' })
    .select('name campusCode type isMainCampus address')
    .sort({ isMainCampus: -1, name: 1 });

  res.json({
    success: true,
    data: campuses.map((c) => ({
      _id: c._id,
      name: c.name,
      campusCode: c.campusCode,
      type: c.type,
      isMainCampus: c.isMainCampus,
      city: c.address?.city || '',
      province: c.address?.province || '',
      address: c.address || null,
    })),
  });
});

export const getPublicSessions = handle(async (_req, res) => {
  const sessions = await AcademicSession.find({
    isDeleted: notDeleted,
    status: { $in: ['Active', 'Upcoming'] },
  })
    .select('name code startDate endDate status isCurrent')
    .sort({ startDate: -1 });

  res.json({ success: true, data: sessions });
});

/**
 * Structured catalog for public browse:
 * university → Active campuses → programs (via department campusIds) → categories.
 */
export const getPublicCatalog = handle(async (_req, res) => {
  const now = new Date();

  const [university, campuses, departments, programs] = await Promise.all([
    University.findOne({ isDeleted: notDeleted, status: 'Active' })
      .select(
        'universityName shortName universityCode universityType website officialEmail phoneNumber address'
      )
      .lean(),
    Campus.find({ isDeleted: notDeleted, status: 'Active' })
      .select('name campusCode type isMainCampus address description')
      .sort({ isMainCampus: -1, name: 1 })
      .lean(),
    Department.find({ isDeleted: notDeleted })
      .select('_id name code campusIds')
      .lean(),
    Program.find({ isDeleted: notDeleted, status: 'Active' })
      .populate('departmentId', 'name code campusIds')
      .select(
        'name code degreeLevel duration totalCredits description departmentId admissionOpensAt admissionClosesAt status'
      )
      .sort({ name: 1 })
      .lean(),
  ]);

  const campusIdSet = new Set(campuses.map((c) => String(c._id)));

  // Fallback map: departmentId → campusIds (if populate missing campusIds on nested dept)
  const deptCampusMap = new Map(
    departments.map((d) => [String(d._id), (d.campusIds || []).map((id) => String(id))])
  );

  const programsByCampus = new Map(campuses.map((c) => [String(c._id), []]));

  for (const program of programs) {
    const dept = program.departmentId;
    const deptId = dept && typeof dept === 'object' ? String(dept._id) : String(dept || '');
    const fromDept =
      dept && typeof dept === 'object' && Array.isArray(dept.campusIds)
        ? dept.campusIds.map((id) => String(id))
        : deptCampusMap.get(deptId) || [];

    const campusIds = fromDept.filter((id) => campusIdSet.has(id));
    for (const campusId of campusIds) {
      programsByCampus.get(campusId)?.push(program);
    }
  }

  let totalPrograms = 0;
  let totalOpen = 0;

  const campusPayload = campuses.map((campus) => {
    const campusPrograms = programsByCampus.get(String(campus._id)) || [];
    const openCount = campusPrograms.filter((p) => isProgramAdmissionOpen(p, now)).length;
    totalPrograms += campusPrograms.length;
    totalOpen += openCount;

    return {
      _id: campus._id,
      name: campus.name,
      campusCode: campus.campusCode,
      type: campus.type,
      isMainCampus: !!campus.isMainCampus,
      description: campus.description || '',
      city: campus.address?.city || '',
      province: campus.address?.province || '',
      address: campus.address || null,
      programCount: campusPrograms.length,
      openProgramCount: openCount,
      categories: groupProgramsByCategory(campusPrograms, (p) => serializePublicProgram(p, now)),
    };
  });

  res.json({
    success: true,
    data: {
      university: university
        ? {
            _id: university._id,
            universityName: university.universityName,
            shortName: university.shortName,
            universityCode: university.universityCode,
            universityType: university.universityType,
            website: university.website || '',
            officialEmail: university.officialEmail || '',
            phoneNumber: university.phoneNumber || '',
            address: university.address || null,
          }
        : null,
      campuses: campusPayload,
      summary: {
        campusCount: campusPayload.length,
        programCount: totalPrograms,
        openProgramCount: totalOpen,
        generatedAt: now.toISOString(),
      },
    },
  });
});

export const submitPublicApplication = handle(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    cnic,
    programId,
    campusId,
    academicSessionId,
  } = req.body;

  if (!firstName || !lastName || !email || !phone || !cnic || !programId || !campusId) {
    return res.status(400).json({
      success: false,
      message: 'firstName, lastName, email, phone, cnic, programId, and campusId are required',
    });
  }

  const extended = parseApplicationExtendedFields(req.body);
  if (!extended.dateOfBirth) {
    return res.status(400).json({ success: false, message: 'dateOfBirth is required' });
  }
  if (!extended.gender) {
    return res.status(400).json({ success: false, message: 'gender is required' });
  }
  if (!extended.guardian.fatherName) {
    return res.status(400).json({ success: false, message: 'guardian.fatherName is required' });
  }
  if (!extended.address.city) {
    return res.status(400).json({ success: false, message: 'address.city is required' });
  }

  const program = await Program.findOne({ _id: programId, isDeleted: notDeleted });
  if (!program) {
    return res.status(400).json({ success: false, message: 'Invalid program selected' });
  }

  const campus = await Campus.findOne({ _id: campusId, isDeleted: notDeleted });
  if (!campus) {
    return res.status(400).json({ success: false, message: 'Invalid campus selected' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedCnic = cnic.trim();

  const duplicate = await StudentApplication.findOne({
    isDeleted: notDeleted,
    status: { $nin: ['Rejected'] },
    $or: [{ email: normalizedEmail }, { cnic: normalizedCnic }],
  });
  if (duplicate) {
    return res.status(409).json({
      success: false,
      message: 'An active application already exists with this email or CNIC',
    });
  }

  const applicationId = await generateApplicationId();
  const application = await StudentApplication.create({
    applicationId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    cnic: normalizedCnic,
    programId,
    campusId,
    academicSessionId: academicSessionId || null,
    ...extended,
    source: 'public',
    status: 'Submitted',
  });

  const populated = await StudentApplication.findById(application._id)
    .populate('programId', 'name code')
    .populate('campusId', 'name campusCode');

  res.status(201).json({
    success: true,
    data: populated,
    message: `Application submitted. Your application ID is ${applicationId}`,
  });
});

export const trackPublicApplication = handle(async (req, res) => {
  const { applicationId, cnic } = req.query;

  if (!applicationId || !cnic) {
    return res.status(400).json({
      success: false,
      message: 'applicationId and cnic are required',
    });
  }

  const application = await findPublicApplicationByIdAndCnic(applicationId, cnic);
  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'No application found with the provided details',
    });
  }

  await application.populate([
    { path: 'programId', select: 'name code' },
    { path: 'campusId', select: 'name campusCode' },
    { path: 'academicSessionId', select: 'name code' },
  ]);

  const documents = await StudentDocument.find({
    studentApplication: application._id,
    isDeleted: notDeleted,
  })
    .select(
      'documentType documentName originalName fileName mimeType reviewStatus reviewNotes reviewedAt createdAt'
    )
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: serializeTrackApplication(application, documents),
  });
});

export const updatePublicApplication = handle(async (req, res) => {
  const application = await findPublicApplicationByIdAndCnic(req.params.id, req.body.cnic);
  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'No application found with the provided details',
    });
  }

  if (['Promoted', 'Accepted', 'Rejected'].includes(application.status)) {
    return res.status(400).json({
      success: false,
      message: 'This application can no longer be edited',
    });
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    programId,
    campusId,
    academicSessionId,
    applicantReply,
  } = req.body;

  if (!firstName || !lastName || !email || !phone || !programId || !campusId) {
    return res.status(400).json({
      success: false,
      message: 'firstName, lastName, email, phone, programId, and campusId are required',
    });
  }

  const extended = parseApplicationExtendedFields(req.body);
  if (!extended.dateOfBirth) {
    return res.status(400).json({ success: false, message: 'dateOfBirth is required' });
  }
  if (!extended.gender) {
    return res.status(400).json({ success: false, message: 'gender is required' });
  }
  if (!extended.guardian.fatherName) {
    return res.status(400).json({ success: false, message: 'guardian.fatherName is required' });
  }
  if (!extended.address.city) {
    return res.status(400).json({ success: false, message: 'address.city is required' });
  }

  const program = await Program.findOne({ _id: programId, isDeleted: notDeleted });
  if (!program) {
    return res.status(400).json({ success: false, message: 'Invalid program selected' });
  }
  const campus = await Campus.findOne({ _id: campusId, isDeleted: notDeleted });
  if (!campus) {
    return res.status(400).json({ success: false, message: 'Invalid campus selected' });
  }

  application.firstName = String(firstName).trim();
  application.lastName = String(lastName).trim();
  application.email = String(email).toLowerCase().trim();
  application.phone = String(phone).trim();
  // CNIC stays locked as identity key
  application.programId = programId;
  application.campusId = campusId;
  application.academicSessionId = academicSessionId || null;
  Object.assign(application, extended);

  if (applicantReply !== undefined) {
    application.applicantReply = String(applicantReply || '').trim();
    application.applicantRepliedAt = new Date();
  }

  application.status = 'Under Review';
  await application.save();

  await application.populate([
    { path: 'programId', select: 'name code' },
    { path: 'campusId', select: 'name campusCode' },
    { path: 'academicSessionId', select: 'name code' },
  ]);

  const documents = await StudentDocument.find({
    studentApplication: application._id,
    isDeleted: notDeleted,
  })
    .select(
      'documentType documentName originalName fileName mimeType reviewStatus reviewNotes reviewedAt createdAt'
    )
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: serializeTrackApplication(application, documents),
    message: 'Updates sent to admissions. Your application is back Under Review.',
  });
});
