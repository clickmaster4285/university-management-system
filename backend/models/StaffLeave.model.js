import mongoose from 'mongoose';

const staffLeaveSchema = new mongoose.Schema(
  {
    leaveId: {
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
    type: {
      type: String,
      enum: ['Annual', 'Sick', 'Casual', 'Maternity', 'Paternity', 'Unpaid', 'Other'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
      default: 'Pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedDate: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
    days: {
      type: Number,
      default: 0,
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

staffLeaveSchema.pre('save', function preSave(next) {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(new Date(this.endDate) - new Date(this.startDate));
    this.days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
  if (!this.leaveId) {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.leaveId = `LV-${year}-${random}`;
  }
  next();
});

staffLeaveSchema.index({ staffMember: 1, startDate: -1 });
staffLeaveSchema.index({ status: 1 });

export default mongoose.model('StaffLeave', staffLeaveSchema);
