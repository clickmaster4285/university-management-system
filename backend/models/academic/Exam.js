import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  // Basic Information
  examId: {
    type: String,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['Midterm', 'Final', 'Quiz', 'Lab Assessment', 'Project Defense', 'Case Study', 'Written Exam', 'Practical', 'Viva', 'Other'],
    required: true
  },
  
  // Course Information
  course: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  courseCode: {
    type: String,
    required: [true, 'Course code is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  program: {
    type: String,
    required: [true, 'Program is required'],
    trim: true
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 8
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },

  // Instructor Information
  instructor: {
    type: String,
    required: [true, 'Instructor name is required'],
    trim: true
  },
  instructorEmail: {
    type: String,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },

  // Exam Details
  totalMarks: {
    type: Number,
    required: [true, 'Total marks is required'],
    min: 0,
    default: 100
  },
  passingMarks: {
    type: Number,
    required: [true, 'Passing marks is required'],
    min: 0,
    default: 40
  },
  weightage: {
    type: Number,
    min: 0,
    max: 100,
    default: 20,
    comment: 'Percentage weightage in final grade'
  },

  // Schedule
  examDate: {
    type: Date,
    required: [true, 'Exam date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration in minutes is required'],
    min: 15,
    default: 60
  },

  // Location
  hall: {
    type: String,
    required: [true, 'Hall is required'],
    trim: true
  },
  building: {
    type: String,
    trim: true
  },

  // Invigilators
  invigilators: [{
    name: {
      type: String,
      required: true
    },
    email: String
  }],

  // Status
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Postponed'],
    default: 'Scheduled'
  },

  // Grades
  grades: [{
    studentId: {
      type: String,
      required: true
    },
    studentName: {
      type: String,
      required: true
    },
    registrationNo: String,
    obtainedMarks: {
      type: Number,
      min: 0,
      default: 0
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'I', 'W'],
      default: 'F'
    },
    gpa: {
      type: Number,
      min: 0,
      max: 4,
      default: 0
    },
    remarks: String,
    isPresent: {
      type: Boolean,
      default: true
    }
  }],

  // Statistics
  totalStudents: {
    type: Number,
    default: 0
  },
  passedStudents: {
    type: Number,
    default: 0
  },
  failedStudents: {
    type: Number,
    default: 0
  },
  averageMarks: {
    type: Number,
    default: 0
  },
  highestMarks: {
    type: Number,
    default: 0
  },
  lowestMarks: {
    type: Number,
    default: 0
  },

  // Results Published
  resultsPublished: {
    type: Boolean,
    default: false
  },
  resultsPublishedDate: Date,

  // Instructions
  instructions: {
    type: String,
    trim: true
  },

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
examSchema.index({ courseCode: 1 });
examSchema.index({ examDate: 1 });
examSchema.index({ status: 1 });
examSchema.index({ instructor: 1 });

// Pre-save middleware to generate exam ID
examSchema.pre('save', async function(next) {
  if (this.isNew && !this.examId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.examId = `EXAM-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Method to calculate statistics
examSchema.methods.calculateStatistics = function() {
  const grades = this.grades || [];
  const presentGrades = grades.filter(g => g.isPresent !== false);
  
  this.totalStudents = grades.length;
  this.passedStudents = presentGrades.filter(g => g.obtainedMarks >= this.passingMarks).length;
  this.failedStudents = presentGrades.filter(g => g.obtainedMarks < this.passingMarks).length;
  
  const marks = presentGrades.map(g => g.obtainedMarks);
  if (marks.length > 0) {
    this.averageMarks = marks.reduce((a, b) => a + b, 0) / marks.length;
    this.highestMarks = Math.max(...marks);
    this.lowestMarks = Math.min(...marks);
  }
  
  return this;
};

const Exam = mongoose.model('Exam', examSchema);
export default Exam;