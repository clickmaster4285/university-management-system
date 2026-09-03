import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^[+\d][\d\s-]{6,}$/, 'Please provide a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  universityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University'
  },
  /** Legacy coarse bucket for JWT + authorize() — derived from platformRole when assigned */
  role: {
    type: String,
    enum: ['Admin', 'Teacher', 'Student', 'Staff'],
    default: 'Student'
  },
  /** Single link to Roles & Permissions template */
  platformRole: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlatformRole',
    default: null,
  },
  moduleAccess: {
    type: Map,
    of: Boolean,
    default: undefined,
  },
  staffMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StaffMember',
    default: null,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

userSchema.index({ platformRole: 1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
