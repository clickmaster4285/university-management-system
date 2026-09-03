import mongoose from 'mongoose';

export const SCHEDULE_STATUSES = ['Draft', 'Active', 'Archived'];
export const STUDENT_CATEGORIES = ['Regular', 'Self-Finance', 'Scholarship', 'International'];

const subjectLineSchema = new mongoose.Schema(
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
  { _id: true }
);

const additionalFeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['Fixed', 'Percentage'], default: 'Fixed' },
    amount: { type: Number, default: 0, min: 0 },
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    description: { type: String, trim: true, default: '' },
    isOptional: { type: Boolean, default: false },
    appliesTo: { type: String, enum: ['All', 'Category', 'Batch'], default: 'All' },
  },
  { _id: true }
);

const discountSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Percentage', 'Fixed'], default: 'Percentage' },
    value: { type: Number, default: 0, min: 0 },
    applicableTo: { type: String, enum: ['Tuition Fee', 'Total Fee'], default: 'Tuition Fee' },
    description: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const programSemesterFeeScheduleSchema = new mongoose.Schema(
  {
    scheduleId: { type: String, unique: true },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    semester: { type: Number, required: true, min: 1, max: 16 },
    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
    },
    studentCategory: {
      type: String,
      enum: STUDENT_CATEGORIES,
      default: 'Regular',
    },
    status: { type: String, enum: SCHEDULE_STATUSES, default: 'Draft' },
    effectiveFrom: { type: Date, default: Date.now },
    effectiveTo: { type: Date, default: null },
    subjectLines: { type: [subjectLineSchema], default: [] },
    additionalFees: { type: [additionalFeeSchema], default: [] },
    discount: { type: discountSchema, default: null },
    totalSubjectFee: { type: Number, default: 0, min: 0 },
    totalAdditionalFee: { type: Number, default: 0, min: 0 },
    grossTotal: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    netPayable: { type: Number, default: 0, min: 0 },
    generatedAt: { type: Date, default: null },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    activatedAt: { type: Date, default: null },
    activatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, trim: true, default: '' },
    warnings: { type: [mongoose.Schema.Types.Mixed], default: [] },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

programSemesterFeeScheduleSchema.index({ programId: 1, semester: 1, academicSessionId: 1 });
programSemesterFeeScheduleSchema.index({ programId: 1, status: 1 });
programSemesterFeeScheduleSchema.index({ academicSessionId: 1, status: 1 });

const ProgramSemesterFeeSchedule = mongoose.model(
  'ProgramSemesterFeeSchedule',
  programSemesterFeeScheduleSchema
);

export default ProgramSemesterFeeSchedule;
