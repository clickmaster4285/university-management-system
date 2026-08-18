import mongoose from 'mongoose';

const admissionSchema = new mongoose.Schema({
  // Personal Information
  name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  fatherName: {
    type: String,
    required: [true, "Father's name is required"],
    trim: true
  },
  motherName: {
    type: String,
    trim: true,
    default: ''
  },
  cnic: {
    type: String,
    required: [true, 'CNIC is required'],
    unique: true,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', ''],
    default: ''
  },
  nationality: {
    type: String,
    default: 'Pakistani'
  },
  religion: {
    type: String,
    default: 'Islam'
  },

  // Contact Information
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  city: {
    type: String,
    trim: true,
    default: ''
  },
  state: {
    type: String,
    trim: true,
    default: ''
  },
  postalCode: {
    type: String,
    trim: true,
    default: ''
  },
  country: {
    type: String,
    default: 'Pakistan'
  },

  // Academic Information
  program: {
    type: String,
    required: [true, 'Program is required']
  },
  department: {
    type: String,
    required: [true, 'Department is required']
  },
  semester: {
    type: Number,
    default: 1,
    min: 0,
    max: 8
  },
  academicYear: {
    type: String,
    default: ''
  },
  previousEducation: {
    institution: { type: String, default: '' },
    degree: { type: String, default: '' },
    grade: { type: String, default: '' },
    yearOfCompletion: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  },

  // Application Status
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Accepted', 'Rejected', 'Waitlisted', 'Enrolled'],
    default: 'Pending'
  },
  admissionId: {
    type: String,
    unique: true
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  reviewDate: Date,
  interviewDate: Date,
  decisionDate: Date,
  remarks: String,
  rejectionReason: String,

  // Administrative
  campus: {
    type: String,
    required: [true, 'Campus is required']
  },
  admissionOfficer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  applicationFee: {
    type: Number,
    default: 0
  },
  feeStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Waived', 'Partial'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
admissionSchema.index({ status: 1 });
admissionSchema.index({ program: 1 });
admissionSchema.index({ applicationDate: -1 });

const Admission = mongoose.model('Admission', admissionSchema);
export default Admission;