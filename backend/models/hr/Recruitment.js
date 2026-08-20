// models/Recruitment.js
const mongoose = require('mongoose');

const recruitmentSchema = new mongoose.Schema({
  positionId: {
    type: String,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: [String],
  responsibilities: [String],
  status: {
    type: String,
    enum: ['Open', 'In Review', 'Interviewing', 'Offer Extended', 'Filled', 'Cancelled'],
    default: 'Open'
  },
  applicants: [{
    name: String,
    email: String,
    phone: String,
    resume: String,
    status: {
      type: String,
      enum: ['Applied', 'Shortlisted', 'Interviewed', 'Offered', 'Rejected', 'Hired'],
      default: 'Applied'
    },
    appliedDate: {
      type: Date,
      default: Date.now
    }
  }],
  postedDate: {
    type: Date,
    default: Date.now
  },
  closingDate: {
    type: Date
  },
  salaryRange: {
    min: Number,
    max: Number
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

recruitmentSchema.pre('save', function(next) {
  if (!this.positionId) {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.positionId = `POS-${year}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Recruitment', recruitmentSchema);