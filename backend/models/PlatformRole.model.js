import mongoose from 'mongoose';

const platformRoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    moduleAccess: {
      type: Map,
      of: Boolean,
      default: {},
    },
    isSystem: {
      type: Boolean,
      default: true,
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

const PlatformRole = mongoose.model('PlatformRole', platformRoleSchema);
export default PlatformRole;
