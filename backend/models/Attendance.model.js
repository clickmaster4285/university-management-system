import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  attendanceId: {
    type: String,
    unique: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  studentEmail: {
    type: String,
    required: true
  },
  // Offering link (source of truth for class-level attendance)
  offeringId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseOffering',
    default: null,
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    default: null,
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    default: null,
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
  courseCode: {
    type: String,
    trim: true,
    default: '',
  },
  // Legacy / denormalized display fields (optional during transition)
  program: {
    type: String,
    trim: true,
    default: '',
  },
  semester: {
    type: Number,
    min: 1,
  },
  department: {
    type: String,
    trim: true,
    default: '',
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Leave'],
    required: true,
    default: 'Present'
  },
  checkInTime: {
    type: String
  },
  checkOutTime: {
    type: String
  },
  remarks: {
    type: String,
    trim: true
  },
  markedBy: {
    type: String,
    trim: true
  },
  course: {
    type: String,
    trim: true
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
  timestamps: true
});

// Auto-generate attendanceId
attendanceSchema.pre('save', async function(next) {
  if (this.isNew && !this.attendanceId) {
    const lastRecord = await mongoose.model('Attendance').findOne().sort({ attendanceId: -1 });
    let nextId = 1;
    if (lastRecord && lastRecord.attendanceId) {
      const lastNumber = parseInt(lastRecord.attendanceId.replace('ATT-', ''));
      nextId = lastNumber + 1;
    }
    this.attendanceId = `ATT-${String(nextId).padStart(4, '0')}`;
  }
  next();
});

// Per-offering unique attendance (one mark per student per class per day)
attendanceSchema.index(
  { studentId: 1, date: 1, offeringId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
attendanceSchema.index({ offeringId: 1, date: 1 });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ batchId: 1 });
attendanceSchema.index({ academicSessionId: 1 });
attendanceSchema.index({ program: 1, semester: 1 });
attendanceSchema.index({ department: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
