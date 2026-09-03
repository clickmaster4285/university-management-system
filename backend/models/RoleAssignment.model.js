import mongoose from 'mongoose';

export const ROLE_TYPES = [
  'HOD',
  'Program Coordinator',
  'Exam Controller',
  'Lab Incharge',
  'Dean',
  'Director',
  'Warden',
  'Librarian',
  'Transport Manager',
];

export const SCOPE_TYPES = ['University', 'Campus', 'Faculty', 'Department', 'Program'];

const roleAssignmentSchema = new mongoose.Schema(
  {
    staffMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffMember',
      required: [true, 'Staff member is required'],
    },
    roleType: {
      type: String,
      enum: ROLE_TYPES,
      required: [true, 'Role type is required'],
    },
    scopeType: {
      type: String,
      enum: SCOPE_TYPES,
      required: [true, 'Scope type is required'],
    },
    scopeId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      default: null,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
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
  },
  { timestamps: true }
);

roleAssignmentSchema.index({ staffMemberId: 1, roleType: 1, scopeType: 1, scopeId: 1 });
roleAssignmentSchema.index({ scopeType: 1, scopeId: 1 });

const RoleAssignment = mongoose.model('RoleAssignment', roleAssignmentSchema);
export default RoleAssignment;
