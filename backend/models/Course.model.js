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
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  program: {
    type: String,
    required: [true, 'Program is required'],
    trim: true
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program'
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 8
  },
  semesterType: {
    type: String,
    enum: ['Fall', 'Spring', 'Summer'],
    default: 'Fall'
  },
  year: {
    type: Number,
    default: new Date().getFullYear()
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 6,
    default: 3
  },
  // Fee related fields
  feePerCredit: {
    type: Number,
    required: [true, 'Fee per credit is required'],
    min: 0,
    default: 0
  },
  totalFee: {
    type: Number,
    min: 0,
    default: 0
  },
  feeType: {
    type: String,
    enum: ['Tuition', 'Lab', 'Library', 'Sports', 'Transport', 'Hostel', 'Other'],
    default: 'Tuition'
  },
  isFeeApplied: {
    type: Boolean,
    default: true
  },
  // Instructor and capacity fields
  instructor: {
    type: String,
    trim: true
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
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
  waitlistCount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Completed', 'Cancelled', 'Draft'],
    default: 'Draft'
  },
  description: {
    type: String,
    trim: true
  },
  prerequisites: [{
    type: String,
    trim: true
  }],
  prerequisitesCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  schedule: {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: {
      type: String,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    endTime: {
      type: String,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    room: {
      type: String,
      trim: true
    },
    building: {
      type: String,
      trim: true
    }
  },
  // Additional metadata
  tags: [{
    type: String,
    trim: true
  }],
  learningOutcomes: [{
    type: String,
    trim: true
  }],
  textbooks: [{
    title: String,
    author: String,
    isbn: String,
    edition: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now
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

// Pre-save middleware to calculate total fee
courseSchema.pre('save', function(next) {
  // Calculate total fee from credits and feePerCredit
  if (this.credits && this.feePerCredit) {
    this.totalFee = this.credits * this.feePerCredit;
  }
  
  // Update lastUpdatedAt
  this.lastUpdatedAt = new Date();
  
  next();
});

// Pre-update middleware to recalculate total fee
courseSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.credits || update.feePerCredit) {
    // We need to handle this carefully since we don't have the document
    // The actual calculation will be done in the controller
  }
  next();
});

// Indexes for better query performance
courseSchema.index({ code: 'text', name: 'text', instructor: 'text', description: 'text' });
// `courseId` has a unique constraint on the field definition; avoid duplicating index declarations
courseSchema.index({ departmentId: 1 });
courseSchema.index({ programId: 1 });
courseSchema.index({ semester: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ isActive: 1 });
courseSchema.index({ feePerCredit: 1 });
courseSchema.index({ departmentId: 1, program: 1, semester: 1 });
courseSchema.index({ code: 1, program: 1, semester: 1 }, { unique: true });

// Virtual field for available seats
courseSchema.virtual('availableSeats').get(function() {
  return Math.max(0, this.capacity - this.enrolledStudents - this.waitlistCount);
});

// Virtual field for total fee (if not stored)
courseSchema.virtual('calculatedTotalFee').get(function() {
  return this.credits * this.feePerCredit || 0;
});

// Methods
courseSchema.methods = {
  // Check if course has available seats
  hasAvailableSeats: function() {
    return this.enrolledStudents < this.capacity;
  },
  
  // Check if course is full
  isFull: function() {
    return this.enrolledStudents >= this.capacity;
  },
  
  // Enroll a student
  enrollStudent: async function() {
    if (this.isFull()) {
      this.waitlistCount += 1;
    } else {
      this.enrolledStudents += 1;
    }
    return this.save();
  },
  
  // Drop a student
  dropStudent: async function() {
    if (this.enrolledStudents > 0) {
      this.enrolledStudents -= 1;
    }
    if (this.waitlistCount > 0) {
      this.waitlistCount -= 1;
      this.enrolledStudents += 1;
    }
    return this.save();
  }
};

// Static methods
courseSchema.statics = {
  // Get courses by department, program, semester
  getByFilter: async function({ departmentId, program, semester, isActive = true }) {
    const filter = { isActive };
    if (departmentId) filter.departmentId = departmentId;
    if (program) filter.program = program;
    if (semester) filter.semester = semester;
    return this.find(filter).sort({ code: 1 });
  },
  
  // Get courses with fee structure
  getWithFeeStructure: async function({ departmentId, program, semester }) {
    const filter = { 
      isActive: true,
      isFeeApplied: true
    };
    if (departmentId) filter.departmentId = departmentId;
    if (program) filter.program = program;
    if (semester) filter.semester = semester;
    return this.find(filter)
      .select('code name credits feePerCredit totalFee departmentId program semester')
      .sort({ code: 1 });
  },
  
  // Get fee summary by program
  getFeeSummaryByProgram: async function(program) {
    const result = await this.aggregate([
      { $match: { program, isActive: true, isFeeApplied: true } },
      { 
        $group: {
          _id: '$semester',
          totalCredits: { $sum: '$credits' },
          totalFee: { $sum: '$totalFee' },
          courseCount: { $count: {} }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    return result;
  },
  
  // Get fee structure for all semesters of a program
  getProgramFeeStructure: async function(program) {
    const result = await this.aggregate([
      { 
        $match: { 
          program, 
          isActive: true, 
          isFeeApplied: true 
        } 
      },
      { 
        $group: {
          _id: {
            semester: '$semester',
            departmentId: '$departmentId'
          },
          courses: { 
            $push: {
              code: '$code',
              name: '$name',
              credits: '$credits',
              feePerCredit: '$feePerCredit',
              totalFee: '$totalFee'
            }
          },
          semesterTotal: { $sum: '$totalFee' },
          totalCredits: { $sum: '$credits' },
          courseCount: { $count: {} }
        }
      },
      { $sort: { '_id.semester': 1 } },
      { 
        $group: {
          _id: '$_id.departmentId',
          semesters: {
            $push: {
              semester: '$_id.semester',
              totalFee: '$semesterTotal',
              totalCredits: '$totalCredits',
              courseCount: '$courseCount',
              courses: '$courses'
            }
          },
          departmentTotal: { $sum: '$semesterTotal' }
        }
      }
    ]);
    return result;
  }
};

// Ensure virtuals are included in JSON output
courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

const Course = mongoose.model('Course', courseSchema);
export default Course;