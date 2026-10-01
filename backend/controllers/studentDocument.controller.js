import fs from 'fs';
import mongoose from 'mongoose';
import { handle } from '../utils/asyncHandler.js';
import {
  Fee,
  Student,
  StudentAdmission,
  StudentApplication,
  StudentDocument,
} from '../models/index.js';
import {
  findStudentUploadByFileName,
  getStudentDocumentRelativePath,
  relativePathFromUploadedFile,
  resolveUploadAbsolutePath,
} from '../utils/uploadPaths.js';

const notDeleted = { $ne: true };

const normalizeCnic = (value) => String(value || '').replace(/\D/g, '');

async function findDossier(identifier) {
  const query = [{ admissionId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return StudentAdmission.findOne({ $or: query, isDeleted: notDeleted });
}

async function findStudent(identifier) {
  const query = [{ studentId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return Student.findOne({ $or: query, isDeleted: notDeleted });
}

async function findApplication(identifier) {
  const query = [{ applicationId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return StudentApplication.findOne({ $or: query, isDeleted: notDeleted });
}

export const resolveDossierForUpload = handle(async (req, res, next) => {
  const dossier = await findDossier(req.params.id);
  if (!dossier) {
    return res.status(404).json({ success: false, message: 'Admission dossier not found' });
  }
  req.studentAdmission = dossier;
  next();
});

export const resolveStudentForUpload = handle(async (req, res, next) => {
  const student = await findStudent(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }
  req.studentRecord = student;
  next();
});

export const resolveApplicationForUpload = handle(async (req, res, next) => {
  const application = await findApplication(req.params.id);
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }
  req.studentApplication = application;
  next();
});

function getOwnerIdForDossier(dossier) {
  return dossier.admissionId || dossier._id.toString();
}

function getOwnerIdForStudent(student) {
  return student.studentId || student._id.toString();
}

function getOwnerIdForApplication(application) {
  return application.applicationId || application._id.toString();
}

function sendDocumentFile(res, document) {
  let absolutePath = resolveUploadAbsolutePath(document.relativePath);
  if (!fs.existsSync(absolutePath)) {
    const recovered = findStudentUploadByFileName(document.fileName);
    if (recovered) {
      absolutePath = recovered.absolutePath;
      // Heal stale relativePath from multer body-order bugs
      if (document.relativePath !== recovered.relativePath) {
        document.relativePath = recovered.relativePath;
        document.save().catch(() => {});
      }
    }
  }

  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ success: false, message: 'File not found on disk' });
  }

  const downloadName = document.originalName || document.fileName || 'document';
  if (document.mimeType) {
    res.type(document.mimeType);
  }
  return res.download(absolutePath, downloadName);
}

function relativePathForUpload(req, ownerId, documentType) {
  return (
    relativePathFromUploadedFile(req.file) ||
    getStudentDocumentRelativePath(ownerId, documentType, req.file.filename)
  );
}

async function softDeletePreviousDocuments({ filter, userId }) {
  await StudentDocument.updateMany(
    { ...filter, isDeleted: notDeleted },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId || null,
      },
    }
  );
}

async function applyDocumentReview(document, req) {
  const reviewStatus = String(req.body.reviewStatus || '').trim();
  const reviewNotes = String(req.body.reviewNotes || '').trim();

  if (!['Pending', 'Approved', 'Rejected'].includes(reviewStatus)) {
    return { error: { status: 400, message: 'reviewStatus must be Pending, Approved, or Rejected' } };
  }
  if (reviewStatus === 'Rejected' && !reviewNotes) {
    return { error: { status: 400, message: 'Rejection reason is required' } };
  }

  document.reviewStatus = reviewStatus;
  document.reviewNotes = reviewStatus === 'Approved' ? reviewNotes : reviewNotes;
  if (reviewStatus === 'Pending') {
    document.reviewNotes = '';
    document.reviewedAt = null;
    document.reviewedBy = null;
  } else {
    document.reviewedAt = new Date();
    document.reviewedBy = req.user?._id || null;
  }
  await document.save();
  return { document };
}

export const listDossierDocuments = handle(async (req, res) => {
  const dossier = await findDossier(req.params.id);
  if (!dossier) {
    return res.status(404).json({ success: false, message: 'Admission dossier not found' });
  }

  const { documentType } = req.query;
  const ownership = [{ studentAdmission: dossier._id }];
  if (dossier.applicationId) {
    ownership.push({ studentApplication: dossier.applicationId });
  }
  const filter = { isDeleted: notDeleted, $or: ownership };
  if (documentType) filter.documentType = documentType;

  const documents = await StudentDocument.find(filter).sort({ createdAt: -1 });
  // Dedupe by documentType keeping newest
  const latest = [];
  const seen = new Set();
  for (const doc of documents) {
    if (seen.has(doc.documentType)) continue;
    seen.add(doc.documentType);
    latest.push(doc);
  }
  res.json({ success: true, data: latest });
});

export const uploadDossierDocument = handle(async (req, res) => {
  const dossier = req.studentAdmission || (await findDossier(req.params.id));
  if (!dossier) {
    return res.status(404).json({ success: false, message: 'Admission dossier not found' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Document file is required' });
  }

  const documentType = req.body.documentType || 'other';
  const documentName =
    req.body.documentName || req.file.originalname.replace(/\.[^.]+$/, '');
  const ownerId = getOwnerIdForDossier(dossier);

  await softDeletePreviousDocuments({
    filter: { studentAdmission: dossier._id, documentType },
    userId: req.user?._id,
  });

  const relativePath = relativePathForUpload(req, ownerId, documentType);

  const document = await StudentDocument.create({
    studentAdmission: dossier._id,
    student: dossier.studentId || null,
    studentName: `${dossier.firstName} ${dossier.lastName}`.trim(),
    documentType,
    documentName,
    fileName: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
    relativePath,
    notes: req.body.notes || '',
    reviewStatus: 'Pending',
    uploadedBy: req.user?._id || null,
  });

  if (dossier.status === 'In Progress') {
    dossier.status = 'Documents Pending';
    await dossier.save();
  }

  res.status(201).json({ success: true, data: document });
});

export const deleteDossierDocument = handle(async (req, res) => {
  const dossier = await findDossier(req.params.id);
  if (!dossier) {
    return res.status(404).json({ success: false, message: 'Admission dossier not found' });
  }

  const document = await StudentDocument.findOne({
    _id: req.params.documentId,
    studentAdmission: dossier._id,
    isDeleted: notDeleted,
  });

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  document.isDeleted = true;
  document.deletedAt = new Date();
  document.deletedBy = req.user?._id || null;
  await document.save();

  res.json({ success: true, message: 'Document deleted' });
});

export const downloadDossierDocument = handle(async (req, res) => {
  const dossier = await findDossier(req.params.id);
  if (!dossier) {
    return res.status(404).json({ success: false, message: 'Admission dossier not found' });
  }

  const document = await StudentDocument.findOne({
    _id: req.params.documentId,
    isDeleted: notDeleted,
    $or: [
      { studentAdmission: dossier._id },
      ...(dossier.applicationId ? [{ studentApplication: dossier.applicationId }] : []),
    ],
  });

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  // Backfill admission link so later dossier downloads stay simple
  if (!document.studentAdmission) {
    document.studentAdmission = dossier._id;
    await document.save();
  }

  return sendDocumentFile(res, document);
});

export const listStudentDocuments = handle(async (req, res) => {
  const student = await findStudent(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  const { documentType } = req.query;
  const filter = { student: student._id, isDeleted: notDeleted };
  if (documentType) filter.documentType = documentType;

  const documents = await StudentDocument.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: documents });
});

export const uploadStudentDocument = handle(async (req, res) => {
  const student = req.studentRecord || (await findStudent(req.params.id));
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Document file is required' });
  }

  const documentType = req.body.documentType || 'other';
  const documentName =
    req.body.documentName || req.file.originalname.replace(/\.[^.]+$/, '');
  const ownerId = getOwnerIdForStudent(student);

  await softDeletePreviousDocuments({
    filter: { student: student._id, documentType },
    userId: req.user?._id,
  });

  const relativePath = relativePathForUpload(req, ownerId, documentType);

  const document = await StudentDocument.create({
    studentAdmission: student.admissionId || null,
    studentApplication: null,
    student: student._id,
    studentName: student.fullName || student.name,
    documentType,
    documentName,
    fileName: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
    relativePath,
    notes: req.body.notes || '',
    reviewStatus: 'Pending',
    uploadedBy: req.user?._id || null,
  });

  res.status(201).json({ success: true, data: document });
});

export const uploadApplicationDocument = handle(async (req, res) => {
  const application = req.studentApplication || (await findApplication(req.params.id));
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  // Public callers must prove ownership with matching CNIC
  if (!req.user) {
    const cnic = String(req.body.cnic || '').trim();
    if (!cnic || normalizeCnic(cnic) !== normalizeCnic(application.cnic)) {
      return res.status(403).json({
        success: false,
        message: 'CNIC does not match this application',
      });
    }
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Document file is required' });
  }

  const documentType = req.body.documentType || 'other';
  const documentName =
    req.body.documentName || req.file.originalname.replace(/\.[^.]+$/, '');
  const ownerId = getOwnerIdForApplication(application);

  await softDeletePreviousDocuments({
    filter: { studentApplication: application._id, documentType },
    userId: req.user?._id,
  });

  const relativePath = relativePathForUpload(req, ownerId, documentType);

  const document = await StudentDocument.create({
    studentAdmission: application.admissionDossierId || null,
    studentApplication: application._id,
    student: null,
    studentName: `${application.firstName} ${application.lastName}`.trim(),
    documentType,
    documentName,
    fileName: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
    relativePath,
    notes: req.body.notes || '',
    reviewStatus: 'Pending',
    uploadedBy: req.user?._id || null,
  });

  // After applicant replaces a rejected file, move status back into staff queue
  if (application.status === 'Action Required') {
    const remainingRejected = await StudentDocument.countDocuments({
      studentApplication: application._id,
      isDeleted: notDeleted,
      reviewStatus: 'Rejected',
    });
    if (remainingRejected === 0) {
      application.status = 'Under Review';
      await application.save();
    }
  }

  if (documentType === 'fee_payment_proof') {
    if (application.admissionDossierId && !document.studentAdmission) {
      document.studentAdmission = application.admissionDossierId;
      await document.save();
    }
    await Fee.findOneAndUpdate(
      {
        studentApplicationId: application._id,
        source: 'admission',
        isDeleted: notDeleted,
        proofStatus: { $in: ['None', 'Rejected', 'Submitted'] },
      },
      {
        $set: {
          proofStatus: 'Submitted',
          proofNotes: req.body.notes || '',
          ...(application.admissionDossierId
            ? { studentAdmissionId: application.admissionDossierId }
            : {}),
        },
      }
    );
  }

  res.status(201).json({ success: true, data: document });
});

export const listApplicationDocuments = handle(async (req, res) => {
  const application = await findApplication(req.params.id);
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  if (!req.user) {
    const cnic = String(req.query.cnic || '').trim();
    if (!cnic || normalizeCnic(cnic) !== normalizeCnic(application.cnic)) {
      return res.status(403).json({
        success: false,
        message: 'CNIC does not match this application',
      });
    }
  }

  const documents = await StudentDocument.find({
    studentApplication: application._id,
    isDeleted: notDeleted,
  }).sort({ createdAt: -1 });

  res.json({ success: true, data: documents });
});

export const downloadApplicationDocument = handle(async (req, res) => {
  const application = await findApplication(req.params.id);
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  const document = await StudentDocument.findOne({
    _id: req.params.documentId,
    studentApplication: application._id,
    isDeleted: notDeleted,
  });

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  return sendDocumentFile(res, document);
});

export const deleteApplicationDocument = handle(async (req, res) => {
  const application = await findApplication(req.params.id);
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  const document = await StudentDocument.findOne({
    _id: req.params.documentId,
    studentApplication: application._id,
    isDeleted: notDeleted,
  });

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  document.isDeleted = true;
  document.deletedAt = new Date();
  document.deletedBy = req.user?._id || null;
  await document.save();

  res.json({ success: true, message: 'Document deleted' });
});

export const reviewApplicationDocument = handle(async (req, res) => {
  const application = await findApplication(req.params.id);
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  const document = await StudentDocument.findOne({
    _id: req.params.documentId,
    studentApplication: application._id,
    isDeleted: notDeleted,
  });

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  const result = await applyDocumentReview(document, req);
  if (result.error) {
    return res.status(result.error.status).json({ success: false, message: result.error.message });
  }

  res.json({ success: true, data: result.document, message: `Document marked ${result.document.reviewStatus}` });
});

export const reviewDossierDocument = handle(async (req, res) => {
  const dossier = await findDossier(req.params.id);
  if (!dossier) {
    return res.status(404).json({ success: false, message: 'Admission dossier not found' });
  }

  const document = await StudentDocument.findOne({
    _id: req.params.documentId,
    studentAdmission: dossier._id,
    isDeleted: notDeleted,
  });

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  const result = await applyDocumentReview(document, req);
  if (result.error) {
    return res.status(result.error.status).json({ success: false, message: result.error.message });
  }

  res.json({ success: true, data: result.document, message: `Document marked ${result.document.reviewStatus}` });
});

export const deleteStudentDocument = handle(async (req, res) => {
  const student = await findStudent(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  const document = await StudentDocument.findOne({
    _id: req.params.documentId,
    student: student._id,
    isDeleted: notDeleted,
  });

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  document.isDeleted = true;
  document.deletedAt = new Date();
  document.deletedBy = req.user?._id || null;
  await document.save();

  res.json({ success: true, message: 'Document deleted' });
});

export const downloadStudentDocument = handle(async (req, res) => {
  const student = await findStudent(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  const document = await StudentDocument.findOne({
    _id: req.params.documentId,
    student: student._id,
    isDeleted: notDeleted,
  });

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  return sendDocumentFile(res, document);
});
