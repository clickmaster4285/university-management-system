import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema({
  facultyId: {
    type: String,
  },
  campusIds: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Campus',
    default: [],
  },
  campusAssignments: {
    type: [
      new mongoose.Schema({
        campusId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Campus',
          required: true,
        },
        headId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'StaffMember',
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
      }, { _id: false }),
    ],
    default: [],
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

// Partial unique indexes — soft-deleted rows are ignored and do not collide on reuse.
// Aligns with backendcontext.md "Soft Delete" section + matches the pattern used in
// CourseOffering, Enrollment, ProgramCurriculum, SemesterRegistration models.
facultySchema.index(
  { facultyId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
facultySchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
facultySchema.index(
  { code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
facultySchema.index({ campusIds: 1 });
facultySchema.index({ name: 'text', code: 'text' });

const Faculty = mongoose.model('Faculty', facultySchema);
export default Faculty;
