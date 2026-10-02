import mongoose from 'mongoose';

const staffLeaveBalanceSchema = new mongoose.Schema(
  {
    staffMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffMember',
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    annualQuota: { type: Number, default: 20, min: 0 },
    sickQuota: { type: Number, default: 10, min: 0 },
    casualQuota: { type: Number, default: 5, min: 0 },
    maternityQuota: { type: Number, default: 90, min: 0 },
    paternityQuota: { type: Number, default: 10, min: 0 },
    annualUsed: { type: Number, default: 0, min: 0 },
    sickUsed: { type: Number, default: 0, min: 0 },
    casualUsed: { type: Number, default: 0, min: 0 },
    maternityUsed: { type: Number, default: 0, min: 0 },
    paternityUsed: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

staffLeaveBalanceSchema.index({ staffMember: 1, year: 1 }, { unique: true });

export default mongoose.model('StaffLeaveBalance', staffLeaveBalanceSchema);
