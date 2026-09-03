import mongoose from 'mongoose';

const programCurriculumSchema = new mongoose.Schema({
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: [true, 'Program is required'],
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required'],
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
  },
  type: {
    type: String,
    enum: ['Core', 'Elective', 'Optional'],
    default: 'Core',
  },
  order: {
    type: Number,
    default: 0,
    min: 0,
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

programCurriculumSchema.index(
  { programId: 1, subjectId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
programCurriculumSchema.index({ programId: 1, semester: 1 });

const ProgramCurriculum = mongoose.model('ProgramCurriculum', programCurriculumSchema);
export default ProgramCurriculum;
