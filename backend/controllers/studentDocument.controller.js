import fs from 'fs';
import mongoose from 'mongoose';
import { handle } from '../utils/asyncHandler.js';
import {
  Student,
  StudentAdmission,
  StudentDocument,
} from '../models/index.js';
import {
  getStudentDocumentRelativePath,
  resolveUploadAbsolutePath,
} from '../utils/uploadPaths.js';

const notDeleted = { $ne: true };

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

function getOwnerIdForDossier(dossier) {
  return dossier.admissionId || dossier._id.toString();
}

function getOwnerIdForStudent(student) {
  return student.studentId || student._id.toString();
}

export const listDossierDocuments = handle(async (req, res) => {
  const dossier = await findDossier(req.params.id);
  if (!dossier) {
    return res.status(404).json({ success: false, message: 'Admission dossier not found' });
  }

  const { documentType } = req.query;
  const filter = { studentAdmission: dossier._id, isDeleted: notDeleted };
  if (documentType) filter.documentType = documentType;

  const documents = await StudentDocument.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: documents });
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

  const relativePath = getStudentDocumentRelativePath(
    ownerId,
    documentType,
    req.file.filename
  );

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
    studentAdmission: dossier._id,
    isDeleted: notDeleted,
  });

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  const absolutePath = resolveUploadAbsolutePath(document.relativePath);
  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ success: false, message: 'File not found on disk' });
  }

  res.download(absolutePath, document.originalName || document.fileName);
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

  const relativePath = getStudentDocumentRelativePath(
    ownerId,
    documentType,
    req.file.filename
  );

  const document = await StudentDocument.create({
    studentAdmission: student.admissionId || null,
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
    uploadedBy: req.user?._id || null,
  });

  res.status(201).json({ success: true, data: document });
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

  const absolutePath = resolveUploadAbsolutePath(document.relativePath);
  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ success: false, message: 'File not found on disk' });
  }

  res.download(absolutePath, document.originalName || document.fileName);
});
