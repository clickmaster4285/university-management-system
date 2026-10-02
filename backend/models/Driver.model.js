import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  // Basic Information
  driverId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Driver name is required'],
    trim: true
  },
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
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  
  // License Information
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true,
    trim: true
  },
  licenseExpiry: {
    type: Date,
    required: [true, 'License expiry date is required']
  },
  licenseClass: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E', 'H'],
    default: 'C'
  },
  
  // Employment Details
  hireDate: {
    type: Date,
    default: Date.now
  },
  employmentStatus: {
    type: String,
    enum: ['Active', 'On Leave', 'Suspended', 'Terminated'],
    default: 'Active'
  },
  salary: {
    type: Number,
    min: 0
  },
  
  // Experience
  experienceYears: {
    type: Number,
    default: 0,
    min: 0
  },
  previousEmployer: {
    type: String,
    trim: true
  },
  
  // Assigned Bus
  assignedBusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus'
  },
  assignedBusNumber: {
    type: String,
    trim: true
  },
  
  // Documents
  documents: {
    cnic: {
      number: String,
      expiry: Date
    },
    medicalCertificate: {
      expiry: Date,
      uploaded: Boolean,
      url: String
    },
    drivingTestResult: {
      passed: Boolean,
      date: Date
    }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['Available', 'On Route', 'Off Duty', 'On Leave'],
    default: 'Available'
  },
  
  // Statistics
  totalTrips: {
    type: Number,
    default: 0
  },
  totalHours: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  
  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Indexes
driverSchema.index({ phone: 1 });
driverSchema.index({ status: 1 });

// Pre-save middleware to generate driver ID
driverSchema.pre('save', async function(next) {
  if (this.isNew && !this.driverId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.driverId = `DRV-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const Driver = mongoose.model('Driver', driverSchema);
export default Driver;