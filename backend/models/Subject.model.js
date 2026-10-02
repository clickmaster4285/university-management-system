import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  subjectId: {
    type: String,
    unique: true,
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required'],
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: 1,
    max: 6,
    default: 3,
  },
  description: {
    type: String,
    trim: true,
  },
  prerequisiteSubjectIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
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
  timestamps: true,
});

subjectSchema.index({ departmentId: 1 });
subjectSchema.index({ status: 1 });
subjectSchema.index({ code: 'text', name: 'text', description: 'text' });

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
