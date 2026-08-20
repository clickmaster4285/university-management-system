// backend/src/models/Department.js
import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  departmentId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  head: {
    type: String,
    trim: true
  },
  faculty: {
    type: String,
    trim: true
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
  }
}, {
  timestamps: true
});

// Auto-generate departmentId
departmentSchema.pre('save', async function(next) {
  if (this.isNew && !this.departmentId) {
    const lastDept = await mongoose.model('Department').findOne().sort({ departmentId: -1 });
    let nextId = 1;
    if (lastDept && lastDept.departmentId) {
      const lastNumber = parseInt(lastDept.departmentId.replace('DEPT-', ''));
      nextId = lastNumber + 1;
    }
    this.departmentId = `DEPT-${String(nextId).padStart(4, '0')}`;
  }
  next();
});

departmentSchema.index({ name: 'text', code: 'text' });

const Department = mongoose.model('Department', departmentSchema);
export default Department;