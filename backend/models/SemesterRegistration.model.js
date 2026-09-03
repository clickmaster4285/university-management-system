import mongoose from 'mongoose';

export const REGISTRATION_MODES = ['package', 'per_subject', 'mixed'];
export const REGISTRATION_STATUSES = ['Registered', 'Paid', 'Partial', 'Dropped'];

const subjectLineSnapshotSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    code: { type: String, trim: true },
    name: { type: String, trim: true },
    credits: { type: Number, min: 0, default: 0 },
    feePerCredit: { type: Number, min: 0, default: 0 },
    feeType: { type: String, default: 'Tuition' },
    lineTotal: { type: Number, min: 0, default: 0 },
    isCore: { type: Boolean, default: true },
    curriculumType: { type: String, enum: ['Core', 'Elective', 'Optional'], default: 'Core' },
    subjectFeeHistoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubjectFeeHistory', default: null },
    missingRate: { type: Boolean, default: false },
  },
  { _id: false }
);

const additionalFeeSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['Fixed', 'Percentage'], default: 'Fixed' },
    amount: { type: Number, default: 0, min: 0 },
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    description: { type: String, trim: true, default: '' },
    isOptional: { type: Boolean, default: false },
    appliesTo: { type: String, enum: ['All', 'Category', 'Batch'], default: 'All' },
  },
  { _id: false }
);

const semesterFeeSnapshotSchema = new mongoose.Schema(
  {
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProgramSemesterFeeSchedule', required: true },
    scheduleCode: { type: String, trim: true },
    studentCategory: { type: String, default: 'Regular' },
    subjectLines: { type: [subjectLineSnapshotSchema], default: [] },
    additionalFees: { type: [additionalFeeSnapshotSchema], default: [] },
    discount: {
      type: {
        type: String,
        enum: ['Percentage', 'Fixed'],
        default: 'Percentage',
      },
      value: { type: Number, default: 0, min: 0 },
      applicableTo: { type: String, enum: ['Tuition Fee', 'Total Fee'], default: 'Tuition Fee' },
      description: { type: String, trim: true, default: '' },
    },
    totalSubjectFee: { type: Number, default: 0, min: 0 },
    totalAdditionalFee: { type: Number, default: 0, min: 0 },
    grossTotal: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    netPayable: { type: Number, default: 0, min: 0 },
    lockedAt: { type: Date, required: true },
    feePolicy: { type: String, default: 'package' },
  },
  { _id: false }
);

const semesterRegistrationSchema = new mongoose.Schema(
  {
    registrationId: { type: String, unique: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
    },
    programSemester: { type: Number, required: true, min: 1, max: 16 },
    registrationMode: {
      type: String,
      enum: REGISTRATION_MODES,
      default: 'package',
    },
    studentCategory: { type: String, default: 'Regular' },
    semesterFeeSnapshot: { type: semesterFeeSnapshotSchema, required: true },
    enrollmentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' }],
    feeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fee', default: null },
    status: { type: String, enum: REGISTRATION_STATUSES, default: 'Registered' },
    registeredAt: { type: Date, default: Date.now },
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    warnings: { type: [mongoose.Schema.Types.Mixed], default: [] },
    notes: { type: String, trim: true, default: '' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

semesterRegistrationSchema.index(
  { studentId: 1, batchId: 1, academicSessionId: 1, programSemester: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false, status: { $ne: 'Dropped' } } }
);
semesterRegistrationSchema.index({ programId: 1, academicSessionId: 1, programSemester: 1 });
semesterRegistrationSchema.index({ studentId: 1, status: 1 });
semesterRegistrationSchema.index({ batchId: 1, academicSessionId: 1 });

const SemesterRegistration = mongoose.model('SemesterRegistration', semesterRegistrationSchema);

export default SemesterRegistration;
