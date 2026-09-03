import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    admissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentAdmission',
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    firstName: {
      type: String,
      trim: true,
      default: '',
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    fatherName: {
      type: String,
      trim: true,
      default: '',
    },
    motherName: {
      type: String,
      trim: true,
      default: '',
    },
    cnic: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      default: null,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campus',
      default: null,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
    program: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    campus: {
      type: String,
      trim: true,
      default: '',
    },
    currentSemester: {
      type: Number,
      min: 1,
      max: 12,
      default: 1,
    },
    semester: {
      type: Number,
      min: 1,
      max: 12,
      default: 1,
    },
    gpa: {
      type: Number,
      min: 0,
      max: 4,
      default: 0,
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 4,
      default: 0,
    },
    attendance: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    fee: {
      type: String,
      enum: ['Paid', 'Pending', 'Due', 'Overdue', 'Scholarship', ''],
      default: 'Pending',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'On Leave', 'Graduated', 'Suspended', 'Dropped'],
      default: 'Active',
    },
    enrollmentDate: {
      type: Date,
      default: null,
    },
    photo: {
      type: String,
      default: '',
    },
    profileImage: {
      type: String,
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

studentSchema.index({ email: 1 });
studentSchema.index({ cnic: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ programId: 1 });
studentSchema.index({ firstName: 'text', lastName: 'text', name: 'text', email: 'text', studentId: 'text' });

studentSchema.virtual('fullName').get(function fullName() {
  if (this.firstName || this.lastName) {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
  return this.name || '';
});

studentSchema.pre('save', function preSave(next) {
  if (!this.name && (this.firstName || this.lastName)) {
    this.name = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
  if (!this.semester && this.currentSemester) {
    this.semester = this.currentSemester;
  }
  if (!this.cgpa && this.gpa) {
    this.cgpa = this.gpa;
  }
  next();
});

studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

export default mongoose.model('Student', studentSchema);
