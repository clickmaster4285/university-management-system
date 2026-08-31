import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

export const UPLOAD_MODULES = {
  HR: 'hr',
  STAFF: 'staff',
  STUDENTS: 'students',
  FINANCE: 'finance',
  OTHER: 'other',
};

export const HR_DOCUMENT_TYPES = [
  'cnic',
  'contract',
  'appointment_letter',
  'qualification',
  'experience_letter',
  'salary_slip',
  'other',
];

const sanitizeSegment = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 80) || 'file';

export const buildStaffDocumentFileName = ({
  staffId,
  documentType,
  documentName,
  originalName,
}) => {
  const ext = path.extname(originalName || '').toLowerCase() || '';
  const base = sanitizeSegment(documentName || path.basename(originalName || 'document', ext));
  const type = sanitizeSegment(documentType || 'other');
  const id = sanitizeSegment(staffId || 'staff');
  const stamp = Date.now();
  return `${id}_${type}_${base}_${stamp}${ext}`;
};

export const ensureDirectory = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

export const getStaffDocumentDirectory = (staffId, documentType = 'other') => {
  const safeStaffId = sanitizeSegment(staffId);
  const safeType = sanitizeSegment(documentType);
  const dir = path.join(UPLOAD_ROOT, UPLOAD_MODULES.HR, safeStaffId, safeType);
  ensureDirectory(dir);
  return dir;
};

export const getStaffDocumentRelativePath = (staffId, documentType, fileName) => {
  const safeStaffId = sanitizeSegment(staffId);
  const safeType = sanitizeSegment(documentType);
  return path.posix.join(UPLOAD_MODULES.HR, safeStaffId, safeType, fileName);
};

export const resolveUploadAbsolutePath = (relativePath) =>
  path.join(UPLOAD_ROOT, ...String(relativePath).split('/'));
