import mongoose from 'mongoose';

const programSchema = new mongoose.Schema({
  programId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Program name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Program code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  degreeLevel: {
    type: String,
    enum: ['BS', 'MS', 'PhD', 'BBA', 'MBA', 'LLB', 'Other'],
    required: [true, 'Degree level is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: 1,
    default: 8
  },
  totalCredits: {
    type: Number,
    min: 0,
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
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

programSchema.index({ departmentId: 1 });
programSchema.index({ name: 'text', code: 'text' });

const Program = mongoose.model('Program', programSchema);
export default Program;
