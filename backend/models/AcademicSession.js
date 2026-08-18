// backend/src/models/AcademicSession.js
import mongoose from 'mongoose';

const academicSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Session name is required'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Session code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Upcoming', 'Completed'],
    default: 'Upcoming'
  },
  isCurrent: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Auto-generate sessionId
academicSessionSchema.pre('save', async function(next) {
  if (this.isNew && !this.sessionId) {
    const lastSession = await mongoose.model('AcademicSession').findOne().sort({ sessionId: -1 });
    let nextId = 1;
    if (lastSession && lastSession.sessionId) {
      const lastNumber = parseInt(lastSession.sessionId.replace('SESS-', ''));
      nextId = lastNumber + 1;
    }
    this.sessionId = `SESS-${String(nextId).padStart(4, '0')}`;
  }
  next();
});

// Ensure only one session can be current at a time
academicSessionSchema.pre('save', async function(next) {
  if (this.isCurrent) {
    await mongoose.model('AcademicSession').updateMany(
      { _id: { $ne: this._id }, isCurrent: true },
      { $set: { isCurrent: false } }
    );
  }
  next();
});

// Validate that start date is before end date
academicSessionSchema.pre('save', function(next) {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    next(new Error('Start date must be before end date'));
  }
  next();
});

// Update status based on dates
academicSessionSchema.pre('save', function(next) {
  const now = new Date();
  if (this.startDate && this.endDate) {
    if (this.status !== 'Inactive') {
      if (now < this.startDate) {
        this.status = 'Upcoming';
      } else if (now >= this.startDate && now <= this.endDate) {
        this.status = 'Active';
      } else if (now > this.endDate) {
        this.status = 'Completed';
      }
    }
  }
  next();
});

academicSessionSchema.index({ name: 'text', code: 'text' });

const AcademicSession = mongoose.model('AcademicSession', academicSessionSchema);
export default AcademicSession;