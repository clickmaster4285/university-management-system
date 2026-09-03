import mongoose from 'mongoose';

const staffAttendanceSchema = new mongoose.Schema(
  {
    attendanceId: {
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
    date: {
      type: Date,
      required: true,
    },
    checkInTime: {
      type: String,
      default: '',
    },
    checkOutTime: {
      type: String,
      default: '',
    },
    scheduledStart: {
      type: String,
      default: '',
    },
    scheduledEnd: {
      type: String,
      default: '',
    },
    isWorkingDay: {
      type: Boolean,
      default: true,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    lateMinutes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Leave', 'Off-day'],
      default: 'Present',
    },
    leaveRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffLeave',
      default: null,
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
    },
    markedBy: {
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

staffAttendanceSchema.pre('save', function preSave(next) {
  if (!this.attendanceId) {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.attendanceId = `SAT-${year}-${random}`;
  }
  next();
});

staffAttendanceSchema.index({ staffMember: 1, date: 1 }, { unique: true });
staffAttendanceSchema.index({ date: 1, status: 1 });

export default mongoose.model('StaffAttendance', staffAttendanceSchema);
