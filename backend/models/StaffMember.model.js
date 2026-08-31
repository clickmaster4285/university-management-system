import mongoose from 'mongoose';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const employmentSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campus',
      default: null,
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Visiting', 'Intern'],
      default: 'Full-time',
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const qualificationSchema = new mongoose.Schema(
  {
    degree: String,
    institution: String,
    country: String,
    year: Number,
    grade: String,
    field: String,
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    organization: String,
    role: String,
    startDate: Date,
    endDate: Date,
    description: String,
  },
  { _id: false }
);

const teacherProfileSchema = new mongoose.Schema(
  {
    summary: { type: String, trim: true, default: '' },
    specialization: { type: String, trim: true, default: '' },
    researchInterests: [{ type: String, trim: true }],
    qualifications: [qualificationSchema],
    experience: [experienceSchema],
    officeHours: { type: String, trim: true, default: '' },
    officeLocation: { type: String, trim: true, default: '' },
    orcid: { type: String, trim: true, default: '' },
    googleScholar: { type: String, trim: true, default: '' },
    researchGate: { type: String, trim: true, default: '' },
    linkedin: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const workScheduleDaySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: WEEKDAYS,
      required: true,
    },
    isWorkingDay: {
      type: Boolean,
      default: true,
    },
    startTime: {
      type: String,
      default: '09:00',
    },
    endTime: {
      type: String,
      default: '17:00',
    },
  },
  { _id: false }
);

const compensationSchema = new mongoose.Schema(
  {
    basicSalary: { type: Number, default: 0, min: 0 },
    allowances: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'PKR', trim: true },
    payFrequency: {
      type: String,
      enum: ['Monthly', 'Bi-weekly', 'Weekly'],
      default: 'Monthly',
    },
    bankName: { type: String, trim: true, default: '' },
    accountTitle: { type: String, trim: true, default: '' },
    accountNumber: { type: String, trim: true, default: '' },
    iban: { type: String, trim: true, default: '' },
    effectiveFrom: { type: Date, default: null },
  },
  { _id: false }
);

const staffMemberSchema = new mongoose.Schema(
  {
    staffId: {
      type: String,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    personalEmail: {
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
    cnic: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say', ''],
      default: '',
    },
    photo: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    emergencyContact: {
      name: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      relation: { type: String, trim: true, default: '' },
    },
    joiningDate: {
      type: Date,
      default: null,
    },
    jobDescription: {
      type: String,
      trim: true,
      default: '',
    },
    workSchedule: {
      type: [workScheduleDaySchema],
      default: [],
    },
    compensation: {
      type: compensationSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Resigned', 'Terminated', 'Retired'],
      default: 'Active',
    },
    isAcademic: {
      type: Boolean,
      default: false,
    },
    employments: {
      type: [employmentSchema],
      default: [],
    },
    teacherProfile: {
      type: teacherProfileSchema,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    hiredFromRecruitmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recruitment',
      default: null,
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

staffMemberSchema.index({ email: 1 });
staffMemberSchema.index({ status: 1 });
staffMemberSchema.index({ isAcademic: 1 });
staffMemberSchema.index({ 'employments.departmentId': 1 });
staffMemberSchema.index({ firstName: 'text', lastName: 'text', email: 'text', staffId: 'text' });

staffMemberSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`.trim();
});

staffMemberSchema.set('toJSON', { virtuals: true });
staffMemberSchema.set('toObject', { virtuals: true });

const StaffMember = mongoose.model('StaffMember', staffMemberSchema);
export default StaffMember;
