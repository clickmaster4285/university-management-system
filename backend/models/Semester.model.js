// backend/src/models/Semester.js
import mongoose from 'mongoose';

const semesterSchema = new mongoose.Schema({
  semesterId: {
    type: String,
    unique: true
  },
  academicSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    required: [true, 'Academic session is required']
  },
  academicSessionName: {
    type: String,
    // Remove 'required: true' and make it optional
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Semester name is required'],
    trim: true
  },
  number: {
    type: Number,
    required: [true, 'Semester number is required'],
    min: 1,
    max: 8
  },
  type: {
    type: String,
    enum: ['Fall', 'Spring', 'Summer', 'Winter'],
    required: [true, 'Semester type is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  registrationStart: {
    type: Date
  },
  registrationEnd: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Active', 'Completed', 'Inactive'],
    default: 'Upcoming'
  },
  description: {
    type: String,
    trim: true
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

// Auto-generate semesterId
semesterSchema.pre('save', async function(next) {
  if (this.isNew && !this.semesterId) {
    const lastSemester = await mongoose.model('Semester').findOne().sort({ semesterId: -1 });
    let nextId = 1;
    if (lastSemester && lastSemester.semesterId) {
      const lastNumber = parseInt(lastSemester.semesterId.replace('SEM-', ''));
      nextId = lastNumber + 1;
    }
    this.semesterId = `SEM-${String(nextId).padStart(4, '0')}`;
  }
  next();
});

// Populate academicSessionName - this will run on save
semesterSchema.pre('save', async function(next) {
  if (this.academicSessionId) {
    try {
      const AcademicSession = mongoose.model('AcademicSession');
      const session = await AcademicSession.findById(this.academicSessionId);
      if (session) {
        this.academicSessionName = session.name;
      }
    } catch (err) {
      console.error('Error populating academicSessionName:', err);
      // Don't fail the save, just log the error
    }
  }
  next();
});

// Validate dates
semesterSchema.pre('save', function(next) {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    next(new Error('Start date must be before end date'));
  }
  if (this.registrationStart && this.registrationEnd && this.registrationStart >= this.registrationEnd) {
    next(new Error('Registration start must be before registration end'));
  }
  next();
});

// Update status based on dates
semesterSchema.pre('save', function(next) {
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

semesterSchema.index({ name: 'text', type: 'text' });

const Semester = mongoose.model('Semester', semesterSchema);
export default Semester;