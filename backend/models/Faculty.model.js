import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema({
  facultyId: {
    type: String,
    unique: true,
  },
  campusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campus',
    required: [true, 'Campus ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Faculty name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Faculty code is required'],
    uppercase: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  headId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  phone: {
    type: String,
    trim: true,
  },
  establishedDate: {
    type: Date,
  },
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

facultySchema.index({ campusId: 1, name: 1 }, { unique: true });
facultySchema.index({ name: 'text', code: 'text' });

const Faculty = mongoose.model('Faculty', facultySchema);
export default Faculty;
