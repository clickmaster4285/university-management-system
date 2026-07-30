import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  courseId: {
    type: String,
    unique: true
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  departmentName: {
    type: String,
    required: true,
    trim: true
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 6,
    default: 3
  },
  instructor: {
    type: String,
    trim: true
  },
  semester: {
    type: String,
    enum: ['Fall', 'Spring', 'Summer'],
    default: 'Fall'
  },
  year: {
    type: Number,
    default: new Date().getFullYear()
  },
  capacity: {
    type: Number,
    default: 30,
    min: 1
  },
  enrolledStudents: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Completed', 'Cancelled'],
    default: 'Active'
  },
  description: {
    type: String,
    trim: true
  },
  prerequisites: [{
    type: String,
    trim: true
  }],
  schedule: {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: String,
    endTime: String,
    room: String
  }
}, {
  timestamps: true
});

// Auto-generate courseId
courseSchema.pre('save', async function(next) {
  if (this.isNew && !this.courseId) {
    const lastCourse = await mongoose.model('Course').findOne().sort({ courseId: -1 });
    let nextId = 1;
    if (lastCourse && lastCourse.courseId) {
      const lastNumber = parseInt(lastCourse.courseId.replace('CRS-', ''));
      nextId = lastNumber + 1;
    }
    this.courseId = `CRS-${String(nextId).padStart(4, '0')}`;
  }
  next();
});

courseSchema.index({ code: 'text', name: 'text', instructor: 'text' });
courseSchema.index({ courseId: 1 });
courseSchema.index({ department: 1 });
courseSchema.index({ status: 1 });

const Course = mongoose.model('Course', courseSchema);
export default Course;