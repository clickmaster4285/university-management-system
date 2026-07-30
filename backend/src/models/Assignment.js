import mongoose from 'mongoose';
import './User.js';

const assignmentSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Assignment description is required'],
    trim: true
  },
  assignmentId: {
    type: String,
    unique: true
  },

  // Course & Academic Information
  course: {
    type: String,
    required: [true, 'Course is required'],
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

  // Assignment Details
  type: {
    type: String,
    enum: ['Homework', 'Quiz', 'Project', 'Lab Report', 'Research Paper', 'Presentation', 'Case Study', 'Other'],
    default: 'Homework'
  },
  maxScore: {
    type: Number,
    required: [true, 'Maximum score is required'],
    min: 0,
    default: 100
  },
  passingScore: {
    type: Number,
    min: 0,
    default: 60
  },
  weightage: {
    type: Number,
    min: 0,
    max: 100,
    default: 10,
    comment: 'Percentage weightage in final grade'
  },

  // Dates
  assignedDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  submissionDeadline: {
    type: Date,
    required: [true, 'Submission deadline is required']
  },
  lateSubmissionDeadline: {
    type: Date,
    comment: 'Deadline for late submissions (with penalty)'
  },
  gradingStartDate: Date,
  gradingEndDate: Date,

  // Files & Resources
  attachments: [{
    filename: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  resources: [{
    title: String,
    url: String,
    description: String
  }],

  // Submission Settings
  allowLateSubmissions: {
    type: Boolean,
    default: false
  },
  lateSubmissionPenalty: {
    type: Number,
    min: 0,
    max: 100,
    default: 10,
    comment: 'Percentage penalty for late submissions'
  },
  maxAttempts: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  submissionType: {
    type: String,
    enum: ['File Upload', 'Text Entry', 'Link', 'Multiple'],
    default: 'File Upload'
  },
  allowedFileTypes: [{
    type: String,
    enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'rar', 'jpg', 'png', 'txt', 'md']
  }],
  maxFileSize: {
    type: Number,
    default: 10485760,
    comment: 'Max file size in bytes (default: 10MB)'
  },

  // Status & Settings
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Open', 'Closed', 'Grading', 'Graded', 'Archived'],
    default: 'Draft'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isGraded: {
    type: Boolean,
    default: false
  },
  showGrades: {
    type: Boolean,
    default: true
  },

  // Grading Rubric
  rubric: [{
    criterion: {
      type: String,
      required: true
    },
    description: String,
    maxPoints: {
      type: Number,
      required: true,
      min: 0
    }
  }],

  // Instructions
  instructions: {
    type: String,
    trim: true
  },
  gradingCriteria: {
    type: String,
    trim: true
  },

  // Statistics
  totalSubmissions: {
    type: Number,
    default: 0
  },
  gradedSubmissions: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
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

// Indexes for better query performance
assignmentSchema.index({ course: 1 });
assignmentSchema.index({ instructor: 1 });
assignmentSchema.index({ status: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ assignmentId: 1 });
assignmentSchema.index({ courseCode: 1 });

// Pre-save middleware to generate assignment ID
assignmentSchema.pre('save', async function(next) {
  if (!this.assignmentId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.assignmentId = `ASG-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Virtual field for status based on dates
assignmentSchema.virtual('currentStatus').get(function() {
  const now = new Date();
  if (this.status === 'Draft' || this.status === 'Archived') return this.status;
  if (now > this.dueDate) return 'Overdue';
  if (now > this.submissionDeadline) return 'Closed';
  return 'Open';
});

// Method to check if assignment is accepting submissions
assignmentSchema.methods.isAcceptingSubmissions = function() {
  const now = new Date();
  if (this.status === 'Closed' || this.status === 'Graded' || this.status === 'Archived') {
    return false;
  }
  return now <= this.submissionDeadline;
};

// Method to calculate late penalty
assignmentSchema.methods.calculateLatePenalty = function(submissionDate) {
  if (!this.allowLateSubmissions) return 0;
  if (submissionDate <= this.dueDate) return 0;
  if (submissionDate <= this.submissionDeadline) return this.lateSubmissionPenalty;
  return 100; // Not accepted after late deadline
};

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;