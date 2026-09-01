import mongoose from 'mongoose';

const studentApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      unique: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    cnic: {
      type: String,
      required: [true, 'CNIC is required'],
      trim: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campus',
      required: true,
    },
    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      default: null,
    },
    previousDegree: {
      type: String,
      default: '',
      trim: true,
    },
    previousMarks: {
      type: String,
      default: '',
      trim: true,
    },
    source: {
      type: String,
      enum: ['public', 'internal'],
      default: 'public',
    },
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'Shortlisted', 'Accepted', 'Rejected', 'Promoted'],
      default: 'Submitted',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
    },
    admissionDossierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentAdmission',
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

studentApplicationSchema.index({ cnic: 1 });
studentApplicationSchema.index({ email: 1 });
studentApplicationSchema.index({ status: 1 });

studentApplicationSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`.trim();
});

studentApplicationSchema.set('toJSON', { virtuals: true });
studentApplicationSchema.set('toObject', { virtuals: true });

export default mongoose.model('StudentApplication', studentApplicationSchema);
