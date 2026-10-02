import multer from 'multer';
import path from 'path';
import {
  buildRecruitmentCvFileName,
  buildStaffDocumentFileName,
  buildStudentDocumentFileName,
  getRecruitmentCvDirectory,
  getStaffDocumentDirectory,
  getStudentDocumentDirectory,
} from '../utils/uploadPaths.js';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.oasis.opendocument.text', // .odt
  'text/plain',
  'application/rtf',
  'text/rtf',
]);

const STUDENT_DOCUMENT_EXTENSIONS = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.bmp',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.odt',
  '.txt',
  '.rtf',
]);

function isAllowedStudentDocument(file) {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) return true;
  // Some browsers send octet-stream / empty type for Office files — fall back to extension
  const ext = path.extname(file.originalname || '').toLowerCase();
  return STUDENT_DOCUMENT_EXTENSIONS.has(ext);
}

const CV_MIME_TYPES = new Set([
  'application/pdf',
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
      if (!isAllowedStudentDocument(file)) {
        return cb(
          new Error(
            'Unsupported file type. Allowed: PDF, JPG, PNG, WEBP, GIF, DOC, DOCX, XLS, XLSX, ODT, TXT, RTF'
          )
        );
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
            req.studentApplication?.applicationId ||
            req.studentApplication?._id?.toString() ||
            req.studentRecord?.studentId ||
            req.studentRecord?._id?.toString() ||
            req.params.id;
          const documentType =
            req.body.documentType || req.query.documentType || 'other';
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
          req.studentApplication?.applicationId ||
          req.studentApplication?._id?.toString() ||
          req.studentRecord?.studentId ||
          req.studentRecord?._id?.toString() ||
          req.params.id;
        const documentType =
          req.body.documentType || req.query.documentType || 'other';
        const documentName =
          req.body.documentName ||
          req.query.documentName ||
          path.basename(file.originalname, path.extname(file.originalname));
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
      if (!isAllowedStudentDocument(file)) {
        return cb(
          new Error(
            'Unsupported file type. Allowed: PDF, JPG, PNG, WEBP, GIF, DOC, DOCX, XLS, XLSX, ODT, TXT, RTF'
          )
        );
      }
      return cb(null, true);
    },
  });

export const studentDocumentUpload = createStudentDocumentUpload();

export const createRecruitmentCvUpload = () =>
  multer({
    storage: multer.diskStorage({
      destination: (req, _file, cb) => {
        try {
          const recruitmentId = req.recruitmentRecord?.positionId || req.params.id;
          const dir = getRecruitmentCvDirectory(recruitmentId);
          cb(null, dir);
        } catch (error) {
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        const recruitmentId = req.recruitmentRecord?.positionId || req.params.id;
        const applicantId = req.params.applicantId;
        const fileName = buildRecruitmentCvFileName({
          recruitmentId,
          applicantId,
          originalName: file.originalname,
        });
        cb(null, fileName);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!CV_MIME_TYPES.has(file.mimetype)) {
        return cb(new Error('Unsupported file type. Allowed: PDF, DOC, DOCX'));
      }
      return cb(null, true);
    },
  });

export const recruitmentCvUpload = createRecruitmentCvUpload();
