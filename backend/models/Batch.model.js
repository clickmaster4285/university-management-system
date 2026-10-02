// backend/src/models/Batch.js
import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  batchId: {
    type: String,
    unique: true
  },
  year: {
    type: Number,
    required: [true, 'Batch year is required']
  },
  code: {
    type: String,
    required: [true, 'Batch code is required'],
    unique: true,
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department ID is required']
  },
  program: {
    type: String,
    required: [true, 'Program is required'],
    trim: true
  },
  programId: {
    type: String,
    required: true
  },
  admissionSession: {
    type: String,
    required: [true, 'Admission session is required'],
    trim: true
  },
  admissionSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    required: [true, 'Admission session ID is required']
  },
  admissionSemester: {
    type: String,
    enum: ['Fall', 'Spring', 'Summer', 'Winter'],
    required: [true, 'Admission semester is required']
  },
  expectedGraduation: {
    type: Number,
    required: [true, 'Expected graduation year is required']
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Upcoming', 'Completed'],
    default: 'Upcoming'
  },
  description: {
    type: String,
    trim: true
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

// Auto-generate batchId
batchSchema.pre('save', async function(next) {
  if (this.isNew && !this.batchId) {
    const lastBatch = await mongoose.model('Batch').findOne().sort({ batchId: -1 });
    let nextId = 1;
    if (lastBatch && lastBatch.batchId) {
      const lastNumber = parseInt(lastBatch.batchId.replace('BATCH-', ''));
      nextId = lastNumber + 1;
    }
    this.batchId = `BATCH-${String(nextId).padStart(4, '0')}`;
  }
  next();
});

batchSchema.index({ code: 'text', program: 'text', department: 'text' });

const Batch = mongoose.model('Batch', batchSchema);
export default Batch;