// backend/src/models/Leave.js
import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  leaveId: {
    type: String,
    unique: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Annual', 'Sick', 'Casual', 'Maternity', 'Paternity', 'Unpaid', 'Other'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: {
    type: Date
  },
  days: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate days and generate ID before saving
leaveSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    this.days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
  if (!this.leaveId) {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.leaveId = `LV-${year}-${random}`;
  }
  next();
});

export default mongoose.model('Leave', leaveSchema);