import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  courseId: {
    type: String,
    unique: true,
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required'],
  },
  program: {
    type: String,
    trim: true,
    uppercase: true,
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 16,
  },
  semesterType: {
    type: String,
    enum: ['Fall', 'Spring', 'Summer'],
    default: 'Fall',
  },
  year: {
    type: Number,
    default: () => new Date().getFullYear(),
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 6,
    default: 3,
  },
  feePerCredit: {
    type: Number,
    required: [true, 'Fee per credit is required'],
    min: 0,
    default: 0,
  },
  totalFee: {
    type: Number,
    min: 0,
    default: 0,
  },
  feeType: {
    type: String,
    enum: ['Tuition', 'Lab', 'Library', 'Sports', 'Transport', 'Hostel', 'Other'],
    default: 'Tuition',
  },
  isFeeApplied: {
    type: Boolean,
    default: true,
  },
  instructor: {
    type: String,
    trim: true,
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
  },
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
  waitlistCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Completed', 'Cancelled', 'Draft'],
    default: 'Active',
  },
  description: {
    type: String,
    trim: true,
  },
  prerequisites: [{
    type: String,
    trim: true,
  }],
  prerequisitesCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  }],
  schedule: {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    startTime: {
      type: String,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    endTime: {
      type: String,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    room: {
      type: String,
      trim: true,
    },
    building: {
      type: String,
      trim: true,
    },
  },
  tags: [{
    type: String,
    trim: true,
  }],
  learningOutcomes: [{
    type: String,
    trim: true,
  }],
  textbooks: [{
    title: String,
    author: String,
    isbn: String,
    edition: String,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now,
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

courseSchema.index({ code: 'text', name: 'text', instructor: 'text', description: 'text' });
courseSchema.index({ departmentId: 1 });
courseSchema.index({ programId: 1 });
courseSchema.index({ semester: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ departmentId: 1, programId: 1, semester: 1 });

const Course = mongoose.model('Course', courseSchema);
export default Course;
