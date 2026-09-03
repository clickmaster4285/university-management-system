import mongoose from 'mongoose';

const OFFERING_STATUSES = ['Draft', 'Active', 'Completed', 'Cancelled'];

const scheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
  startTime: String,
  endTime: String,
  room: String,
  building: String,
}, { _id: false });

const courseOfferingSchema = new mongoose.Schema({
  offeringId: {
    type: String,
    unique: true,
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required'],
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: [true, 'Program is required'],
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch is required'],
  },
  academicSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    required: [true, 'Academic session is required'],
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StaffMember',
    default: null,
  },
  schedule: scheduleSchema,
  capacity: {
    type: Number,
    default: 30,
    min: 1,
  },
  enrolledStudents: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: OFFERING_STATUSES,
    default: 'Active',
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

courseOfferingSchema.index(
  { subjectId: 1, batchId: 1, academicSessionId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
courseOfferingSchema.index({ programId: 1, academicSessionId: 1 });
courseOfferingSchema.index({ status: 1 });

const CourseOffering = mongoose.model('CourseOffering', courseOfferingSchema);
export { OFFERING_STATUSES };
export default CourseOffering;
