import mongoose from 'mongoose';

const previousEducationSchema = new mongoose.Schema(
  {
    institution: { type: String, trim: true, default: '' },
    degree: { type: String, trim: true, default: '' },
    grade: { type: String, trim: true, default: '' },
    yearOfCompletion: { type: Number, default: null },
    percentage: { type: Number, default: null },
  },
  { _id: false }
);

const guardianSchema = new mongoose.Schema(
  {
    fatherName: { type: String, trim: true, default: '' },
    motherName: { type: String, trim: true, default: '' },
    guardianName: { type: String, trim: true, default: '' },
    guardianPhone: { type: String, trim: true, default: '' },
    guardianRelation: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    postalCode: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'Pakistan' },
  },
  { _id: false }
);

const studentAdmissionSchema = new mongoose.Schema(
  {
    admissionId: {
      type: String,
      unique: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentApplication',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    cnic: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, default: null },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', ''],
      default: '',
    },
    nationality: { type: String, default: 'Pakistani', trim: true },
    religion: { type: String, default: '', trim: true },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campus',
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      default: null,
    },
    guardian: { type: guardianSchema, default: () => ({}) },
    address: { type: addressSchema, default: () => ({}) },
    previousEducation: { type: [previousEducationSchema], default: [] },
    status: {
      type: String,
      enum: ['In Progress', 'Documents Pending', 'Complete', 'Enrolled'],
      default: 'In Progress',
    },
    interviewDate: { type: Date, default: null },
    decisionDate: { type: Date, default: null },
    admissionOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    remarks: { type: String, default: '', trim: true },
    rejectionReason: { type: String, default: '', trim: true },
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

studentAdmissionSchema.index({ applicationId: 1 });
studentAdmissionSchema.index({ studentId: 1 });
studentAdmissionSchema.index({ status: 1 });

export default mongoose.model('StudentAdmission', studentAdmissionSchema);
