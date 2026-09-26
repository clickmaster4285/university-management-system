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
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', ''],
      default: '',
    },
    nationality: {
      type: String,
      default: 'Pakistani',
      trim: true,
    },
    religion: {
      type: String,
      default: '',
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
    guardian: {
      fatherName: { type: String, trim: true, default: '' },
      motherName: { type: String, trim: true, default: '' },
      guardianName: { type: String, trim: true, default: '' },
      guardianPhone: { type: String, trim: true, default: '' },
      guardianRelation: { type: String, trim: true, default: '' },
    },
    address: {
      street: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      postalCode: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'Pakistan' },
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
    previousEducation: {
      type: [
        {
          institution: { type: String, trim: true, default: '' },
          degree: { type: String, trim: true, default: '' },
          grade: { type: String, trim: true, default: '' },
          yearOfCompletion: { type: Number, default: null },
          percentage: { type: Number, default: null },
        },
      ],
      default: [],
    },
    source: {
      type: String,
      enum: ['public', 'internal'],
      default: 'public',
    },
    status: {
      type: String,
      enum: [
        'Submitted',
        'Under Review',
        'Action Required',
        'Shortlisted',
        'Accepted',
        'Rejected',
        'Promoted',
      ],
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
    /** Visible to the applicant on the public track page */
    applicantMessage: {
      type: String,
      default: '',
      trim: true,
    },
    /** Latest note from applicant when they send corrections back */
    applicantReply: {
      type: String,
      default: '',
      trim: true,
    },
    applicantRepliedAt: {
      type: Date,
      default: null,
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
