import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  teacherId: {
    type: String,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
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
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
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

teacherSchema.index({ departmentId: 1 });
teacherSchema.index({ name: 'text' });

const Teacher = mongoose.model('Teacher', teacherSchema);
export default Teacher;