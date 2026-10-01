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

export const STUDENT_DOCUMENT_TYPES = [
  'cnic',
  'photo',
  'matric',
  'intermediate',
  'bachelor',
  'domicile',
  'character_certificate',
  'migration',
  'fee_payment_proof',
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

export const buildStudentDocumentFileName = ({
  ownerId,
  documentType,
  documentName,
  originalName,
}) => {
  const ext = path.extname(originalName || '').toLowerCase() || '';
  const base = sanitizeSegment(documentName || path.basename(originalName || 'document', ext));
  const type = sanitizeSegment(documentType || 'other');
  const id = sanitizeSegment(ownerId || 'student');
  const stamp = Date.now();
  return `${id}_${type}_${base}_${stamp}${ext}`;
};

export const getStudentDocumentDirectory = (ownerId, documentType = 'other') => {
  const safeOwnerId = sanitizeSegment(ownerId);
  const safeType = sanitizeSegment(documentType);
  const dir = path.join(UPLOAD_ROOT, UPLOAD_MODULES.STUDENTS, safeOwnerId, safeType);
  ensureDirectory(dir);
  return dir;
};

export const getStudentDocumentRelativePath = (ownerId, documentType, fileName) => {
  const safeOwnerId = sanitizeSegment(ownerId);
  const safeType = sanitizeSegment(documentType);
  return path.posix.join(UPLOAD_MODULES.STUDENTS, safeOwnerId, safeType, fileName);
};

export const buildRecruitmentCvFileName = ({ recruitmentId, applicantId, originalName }) => {
  const ext = path.extname(originalName || '').toLowerCase() || '';
  const id = sanitizeSegment(applicantId || 'applicant');
  const posting = sanitizeSegment(recruitmentId || 'recruitment');
  const stamp = Date.now();
  return `${posting}_${id}_${stamp}${ext}`;
};

export const getRecruitmentCvDirectory = (recruitmentId) => {
  const safeId = sanitizeSegment(recruitmentId);
  const dir = path.join(UPLOAD_ROOT, UPLOAD_MODULES.HR, 'recruitment', safeId);
  ensureDirectory(dir);
  return dir;
};

export const getRecruitmentCvRelativePath = (recruitmentId, fileName) => {
  const safeId = sanitizeSegment(recruitmentId);
  return path.posix.join(UPLOAD_MODULES.HR, 'recruitment', safeId, fileName);
};

export const resolveUploadAbsolutePath = (relativePath) =>
  path.join(UPLOAD_ROOT, ...String(relativePath).split('/'));

/** Build DB relative path from the file multer actually wrote */
export const relativePathFromUploadedFile = (file) => {
  if (!file?.path) return null;
  const absolute = path.resolve(file.path);
  const root = path.resolve(UPLOAD_ROOT);
  const relative = path.relative(root, absolute);
  if (!relative || relative.startsWith('..')) return null;
  return relative.split(path.sep).join('/');
};

/** If stored path is missing, locate the same fileName under uploads/students */
export const findStudentUploadByFileName = (fileName) => {
  if (!fileName) return null;
  const studentsRoot = path.join(UPLOAD_ROOT, UPLOAD_MODULES.STUDENTS);
  if (!fs.existsSync(studentsRoot)) return null;

  const stack = [studentsRoot];
  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.name === fileName) {
        const relative = path.relative(UPLOAD_ROOT, full).split(path.sep).join('/');
        return { absolutePath: full, relativePath: relative };
      }
    }
  }
  return null;
};
