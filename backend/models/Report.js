// backend/src/models/Report.js
import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Student', 'Teacher', 'Finance', 'Admission', 'Attendance', 'Library', 'Hostel', 'Transport', 'Exam', 'HR', 'Department'],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['PDF', 'CSV', 'Excel', 'JSON'],
    default: 'PDF'
  },
  parameters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Completed', 'Failed'],
    default: 'Pending'
  },
  fileUrl: {
    type: String,
    default: ''
  },
  schedule: {
    enabled: { type: Boolean, default: false },
    frequency: { type: String, enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly'], default: 'Daily' },
    lastRun: { type: Date },
    nextRun: { type: Date }
  },
  recipients: [{
    email: String,
    name: String
  }],
  tags: [String],
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate report ID before saving
reportSchema.pre('save', function(next) {
  if (!this.reportId) {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.reportId = `RPT-${year}-${random}`;
  }
  next();
});

export default mongoose.model('Report', reportSchema);