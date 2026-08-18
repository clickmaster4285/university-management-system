// backend/src/models/Employee.js
import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Intern'],
    default: 'Full-time'
  },
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Resigned', 'Terminated', 'On Probation'],
    default: 'Active'
  },
  salary: {
    type: Number,
    default: 0
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  address: {
    type: String,
    default: ''
  },
  emergencyContact: {
    name: { type: String, default: '' },
    relationship: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  skills: {
    type: [String],
    default: []
  },
  performanceRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  }
}, {
  timestamps: true
});

// Generate employee ID before saving
employeeSchema.pre('save', function(next) {
  if (!this.employeeId) {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.employeeId = `EMP-${year}-${random}`;
  }
  next();
});

export default mongoose.model('Employee', employeeSchema);