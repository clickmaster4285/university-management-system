import multer from 'multer';
import path from 'path';
import {
  buildStaffDocumentFileName,
  buildStudentDocumentFileName,
  getStaffDocumentDirectory,
  getStudentDocumentDirectory,
} from '../utils/uploadPaths.js';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const createStaffDocumentUpload = () =>
  multer({
    storage: multer.diskStorage({
      destination: (req, _file, cb) => {
        try {
          const staffId = req.staffMember?.staffId || req.params.id;
          const documentType = req.body.documentType || 'other';
          const dir = getStaffDocumentDirectory(staffId, documentType);
          cb(null, dir);
        } catch (error) {
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        const staffId = req.staffMember?.staffId || req.params.id;
        const documentType = req.body.documentType || 'other';
        const documentName = req.body.documentName || path.basename(file.originalname, path.extname(file.originalname));
        const fileName = buildStaffDocumentFileName({
          staffId,
          documentType,
          documentName,
          originalName: file.originalname,
        });
        cb(null, fileName);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return cb(new Error('Unsupported file type. Allowed: PDF, JPG, PNG, WEBP, DOC, DOCX'));
      }
      return cb(null, true);
    },
  });

export const staffDocumentUpload = createStaffDocumentUpload();

export const createStudentDocumentUpload = () =>
  multer({
    storage: multer.diskStorage({
      destination: (req, _file, cb) => {
        try {
          const ownerId =
            req.studentAdmission?.admissionId ||
            req.studentAdmission?._id?.toString() ||
            req.studentRecord?.studentId ||
            req.studentRecord?._id?.toString() ||
            req.params.id;
          const documentType = req.body.documentType || 'other';
          const dir = getStudentDocumentDirectory(ownerId, documentType);
          cb(null, dir);
        } catch (error) {
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        const ownerId =
          req.studentAdmission?.admissionId ||
          req.studentAdmission?._id?.toString() ||
          req.studentRecord?.studentId ||
          req.studentRecord?._id?.toString() ||
          req.params.id;
        const documentType = req.body.documentType || 'other';
        const documentName =
          req.body.documentName || path.basename(file.originalname, path.extname(file.originalname));
        const fileName = buildStudentDocumentFileName({
          ownerId,
          documentType,
          documentName,
          originalName: file.originalname,
        });
        cb(null, fileName);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return cb(new Error('Unsupported file type. Allowed: PDF, JPG, PNG, WEBP, DOC, DOCX'));
      }
      return cb(null, true);
    },
  });

export const studentDocumentUpload = createStudentDocumentUpload();
