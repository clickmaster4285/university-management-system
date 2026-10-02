import mongoose from 'mongoose';

const staffDocumentSchema = new mongoose.Schema(
  {
    documentId: {
      type: String,
      unique: true,
    },
    staffMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffMember',
      required: true,
    },
    staffName: {
      type: String,
      required: true,
      trim: true,
    },
    documentType: {
      type: String,
      enum: [
        'cnic',
        'contract',
        'appointment_letter',
        'qualification',
        'experience_letter',
        'salary_slip',
        'other',
      ],
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

staffDocumentSchema.pre('save', function preSave(next) {
  if (!this.documentId) {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.documentId = `DOC-${year}-${random}`;
  }
  next();
});

staffDocumentSchema.index({ staffMember: 1, documentType: 1 });

export default mongoose.model('StaffDocument', staffDocumentSchema);
