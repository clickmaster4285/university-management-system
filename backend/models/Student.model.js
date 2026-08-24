import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  fatherName: {
    type: String,
    required: [true, "Father's name is required"],
    trim: true
  },
  motherName: {
    type: String,
    trim: true
  },
  cnic: {
    type: String,
    required: [true, 'CNIC is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  program: {
    type: String,
    required: [true, 'Program is required'],
    enum: ['BSCS', 'BBA', 'BEE', 'BSSE', 'BSAI', 'BSE', 'MBA', 'PhD']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['Computer Science', 'Business Administration', 'Electrical Engineering', 
           'Software Engineering', 'Artificial Intelligence', 'Economics', 'Psychology']
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
    default: 1
  },
  gpa: {
    type: Number,
    min: 0,
    max: 4,
    default: 0
  },
  cgpa: {
    type: Number,
    min: 0,
    max: 4,
    default: 0
  },
  attendance: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  fee: {
    type: String,
    enum: ['Paid', 'Pending', 'Due', 'Overdue', 'Scholarship'],
    default: 'Pending'
  },
  city: {
    type: String,
    trim: true
  },
  campus: {
    type: String,
    enum: ['East Campus - Peshawar', 'Main Campus - Islamabad', 'North Campus - Lahore', 
           'South Campus - Karachi', 'West Campus - Quetta'],
    default: 'Main Campus - Islamabad'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Graduated', 'Suspended', 'Dropped'],
    default: 'Active'
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  coursesEnrolled: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  profileImage: {
    type: String
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
  timestamps: true // Adds createdAt and updatedAt
});

// Index for better search performance
studentSchema.index({ name: 'text'});

// Virtual field for full name
studentSchema.virtual('fullName').get(function() {
  return `${this.name} (${this.program})`;
});

// Pre-save middleware
studentSchema.pre('save', function(next) {
  // Auto-calculate CGPA if not provided
  if (!this.cgpa && this.gpa) {
    this.cgpa = this.gpa;
  }
  next();
});

const Student = mongoose.model('Student', studentSchema);
export default Student;