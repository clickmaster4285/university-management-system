import mongoose from 'mongoose';

/**
 * Campus visit / inquiry — info only.
 * Not an application, not a dossier, not a student.
 */
const campusVisitSchema = new mongoose.Schema(
  {
    visitId: { type: String, unique: true },
    visitorName: { type: String, required: [true, 'Visitor name is required'], trim: true },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', default: null },
    interestedProgramId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', default: null },
    purpose: {
      type: String,
      enum: ['Info', 'Tour', 'Counseling', 'Other'],
      default: 'Info',
    },
    notes: { type: String, trim: true, default: '' },
    visitedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['New', 'Follow-up', 'Closed', 'Converted'],
      default: 'New',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

campusVisitSchema.index({ visitedAt: -1 });
campusVisitSchema.index({ status: 1 });
campusVisitSchema.index({ visitorName: 'text', phone: 'text', email: 'text' });

const CampusVisit = mongoose.model('CampusVisit', campusVisitSchema);
export default CampusVisit;
