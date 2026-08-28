// backend/src/models/Department.js
import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({ 
   departmentId: {
    type: String,
    unique: true
  },
  campusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campus',
    required: [true, 'Campus ID is required']
  },
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  headId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    default: null
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    trim: true
  },
  establishedDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  location: {
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

departmentSchema.index({ campusId: 1, name: 1 }, { unique: true });
departmentSchema.index({ name: 'text', code: 'text' });

const Department = mongoose.model('Department', departmentSchema);
export default Department;