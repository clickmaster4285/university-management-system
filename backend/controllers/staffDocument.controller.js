import fs from 'fs';
import mongoose from 'mongoose';
import { handle } from '../utils/asyncHandler.js';
import { StaffDocument, StaffMember } from '../models/index.js';
import {
  getStaffDocumentRelativePath,
  resolveUploadAbsolutePath,
} from '../utils/uploadPaths.js';

const notDeleted = { $ne: true };

async function findStaff(identifier) {
  const query = [{ staffId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return StaffMember.findOne({ $or: query, isDeleted: notDeleted });
}

export const resolveStaffForUpload = handle(async (req, res, next) => {
  const staff = await findStaff(req.params.id);
  if (!staff) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }
  req.staffMember = staff;
  next();
});

export const listStaffDocuments = handle(async (req, res) => {
  const staff = await findStaff(req.params.id);
  if (!staff) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }

  const { documentType } = req.query;
  const filter = { staffMember: staff._id, isDeleted: notDeleted };
  if (documentType) filter.documentType = documentType;

  const documents = await StaffDocument.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: documents });
});

export const uploadStaffDocument = handle(async (req, res) => {
  const staff = await findStaff(req.params.id);
  if (!staff) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Document file is required' });
  }

  const documentType = req.body.documentType || 'other';
  const documentName =
    req.body.documentName || req.file.originalname.replace(/\.[^.]+$/, '');

  const relativePath = getStaffDocumentRelativePath(
    staff.staffId || staff._id.toString(),
    documentType,
    req.file.filename
  );

  const document = await StaffDocument.create({
    staffMember: staff._id,
    staffName: `${staff.firstName} ${staff.lastName}`.trim(),
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

export const deleteStaffDocument = handle(async (req, res) => {
  const staff = await findStaff(req.params.id);
  if (!staff) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }

  const document = await StaffDocument.findOne({
    _id: req.params.documentId,
    staffMember: staff._id,
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

export const downloadStaffDocument = handle(async (req, res) => {
  const staff = await findStaff(req.params.id);
  if (!staff) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }

  const document = await StaffDocument.findOne({
    _id: req.params.documentId,
    staffMember: staff._id,
    isDeleted: notDeleted,
  });

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  const absolutePath = resolveUploadAbsolutePath(document.relativePath);
  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ success: false, message: 'File not found on disk' });
  }

  return res.download(absolutePath, document.originalName || document.fileName);
});
