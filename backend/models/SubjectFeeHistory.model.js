import mongoose from 'mongoose';

const FEE_TYPES = ['Tuition', 'Lab', 'Library', 'Sports', 'Transport', 'Hostel', 'Other'];

const subjectFeeHistorySchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required'],
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    default: null,
  },
  feePerCredit: {
    type: Number,
    required: [true, 'Fee per credit is required'],
    min: 0,
  },
  feeType: {
    type: String,
    enum: FEE_TYPES,
    default: 'Tuition',
  },
  effectiveFrom: {
    type: Date,
    required: [true, 'Effective from date is required'],
  },
  effectiveTo: {
    type: Date,
    default: null,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reason: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

subjectFeeHistorySchema.index({ subjectId: 1, effectiveFrom: -1 });
subjectFeeHistorySchema.index(
  { subjectId: 1, programId: 1 },
  {
    unique: true,
    partialFilterExpression: { effectiveTo: null },
  }
);

const SubjectFeeHistory = mongoose.model('SubjectFeeHistory', subjectFeeHistorySchema);
export { FEE_TYPES };
export default SubjectFeeHistory;
