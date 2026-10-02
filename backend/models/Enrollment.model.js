import mongoose from 'mongoose';

const ENROLLMENT_STATUSES = ['Enrolled', 'Dropped', 'Completed', 'Withdrawn'];

const feeSnapshotSchema = new mongoose.Schema({
  subjectFeeHistoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubjectFeeHistory',
    required: true,
  },
  feePolicy: {
    type: String,
    default: 'current_rate',
  },
  credits: {
    type: Number,
    required: true,
    min: 0,
  },
  feePerCredit: {
    type: Number,
    required: true,
    min: 0,
  },
  totalFee: {
    type: Number,
    required: true,
    min: 0,
  },
  feeType: {
    type: String,
    default: 'Tuition',
  },
  academicSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    required: true,
  },
  lockedAt: {
    type: Date,
    required: true,
  },
}, { _id: false });

const enrollmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student is required'],
  },
  offeringId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseOffering',
    required: [true, 'Offering is required'],
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ENROLLMENT_STATUSES,
    default: 'Enrolled',
  },
  feeSnapshot: {
    type: feeSnapshotSchema,
    required: true,
  },
  feePolicyApplied: {
    type: String,
    default: 'current_rate',
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
}, {
  timestamps: true,
});

enrollmentSchema.index(
  { studentId: 1, offeringId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false, status: 'Enrolled' } }
);
enrollmentSchema.index({ offeringId: 1, status: 1 });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export { ENROLLMENT_STATUSES };
export default Enrollment;
