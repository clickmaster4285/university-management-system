import mongoose from 'mongoose';

export const STUDENT_DOCUMENT_TYPES = [
  'cnic',
  'photo',
  'matric',
  'intermediate',
  'bachelor',
  'domicile',
  'character_certificate',
  'migration',
  'other',
];

const studentDocumentSchema = new mongoose.Schema(
  {
    documentId: {
      type: String,
      unique: true,
    },
    studentAdmission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentAdmission',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    documentType: {
      type: String,
      enum: STUDENT_DOCUMENT_TYPES,
      required: true,
    },
    documentName: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      default: '',
    },
    mimeType: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    relativePath: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

studentDocumentSchema.pre('save', function preSave(next) {
  if (!this.documentId) {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.documentId = `SDOC-${year}-${random}`;
  }
  next();
});

studentDocumentSchema.index({ studentAdmission: 1, documentType: 1 });
studentDocumentSchema.index({ student: 1 });

export default mongoose.model('StudentDocument', studentDocumentSchema);
