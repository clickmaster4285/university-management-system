// backend/src/models/Department.js
import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  departmentId: {
    type: String,
    unique: true
  },
  campusIds: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Campus',
    default: [],
  },
  campusAssignments: [
    {
      campus: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true },
      headId: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffMember', default: null },
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
      location: { type: String, trim: true },
      establishedDate: { type: Date },
      status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    }
  ],
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
  facultyIds: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Faculty',
    default: [],
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

// Code is globally unique (not per-campus) since a department can span campuses.
departmentSchema.index(
  { code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
departmentSchema.index({ campusIds: 1 });
departmentSchema.index({ facultyIds: 1 });
departmentSchema.index({ name: 'text', code: 'text' });

const Department = mongoose.model('Department', departmentSchema);
export default Department;
