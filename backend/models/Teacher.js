import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  teacherId: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Instructor', 'Visiting Faculty']
  },
  specialization: {
    type: String,
    trim: true
  },
  experience: {
    type: Number,
    min: 0,
    default: 0
  },
  // coursesTeaching removed - no longer needed
  qualifications: [{
    degree: String,
    institution: String,
    year: Number,
    specialization: String
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  salary: {
    type: Number,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Retired', 'Resigned', 'On Probation'],
    default: 'Active'
  },
  officeHours: {
    type: String,
    trim: true
  },
  joiningDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Auto-generate teacherId before validation so required fields are satisfied
teacherSchema.pre('validate', async function(next) {
  if (this.isNew && !this.teacherId) {
    const lastTeacher = await mongoose.model('Teacher').findOne().sort({ teacherId: -1 });
    let nextId = 1;
    if (lastTeacher && lastTeacher.teacherId) {
      const lastNumber = parseInt(lastTeacher.teacherId.replace('FAC-', ''));
      nextId = lastNumber + 1;
    }
    this.teacherId = `FAC-${String(nextId).padStart(4, '0')}`;
  }
  next();
});

// Index for search performance
teacherSchema.index({ teacherId: 1 });
teacherSchema.index({ name: 'text', email: 'text' });

const Teacher = mongoose.model('Teacher', teacherSchema);
export default Teacher;