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
  facultyCount: {
    type: Number,
    default: 0
  },
  studentCount: {
    type: Number,
    default: 0
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