import mongoose from "mongoose";

const universitySchema = new mongoose.Schema({
  universityId: {
    type: String,
    unique: true,
  },
  universityName: {
    type: String,
    required: [true, 'University name is required'],
    trim: true,
  },
  universityCode: {
    type: String,
    required: [true, 'University code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  shortName: {
    type: String,
    required: [true, 'Short name is required'],
    uppercase: true,
    trim: true,
  },
  universityType: {
    type: String,
    enum: ['Public', 'Private', 'Semi-Government'],
    default: 'Private',
  },
  registrationNumber: {
    type: String,
    trim: true,
  },
  officialEmail: {
    type: String,
    required: [true, 'Official email is required'],
    lowercase: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  website: {
    type: String,
    trim: true,
  },
  address: {
    country: {
      type: String,
      default: 'Pakistan',
    },
    province: {
      type: String,
      required: [true, 'Province is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
    },
    street: {
      type: String,
      required: [true, 'Address is required'],
    },
  },
  academicSettings: {
    academicSystem: {
      type: String,
      enum: ['Semester', 'Quarter', 'Annual'],
      default: 'Semester',
    },
    gradingSystem: {
      type: String,
      enum: ['GPA', 'Percentage', 'Letter Grade'],
      default: 'GPA',
    },
    maxGPA: {
      type: Number,
      default: 4.0,
      min: 0,
      max: 4.0,
    },
    passingGPA: {
      type: Number,
      default: 2.0,
      min: 0,
      max: 4.0,
    },
  },
  administrator: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    firstName: {
      type: String,
      required: [true, 'Admin first name is required'],
    },
    lastName: {
      type: String,
      required: [true, 'Admin last name is required'],
    },
    email: {
      type: String,
      required: [true, 'Admin email is required'],
      lowercase: true,
    },
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate University ID before saving
universitySchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const University = mongoose.model('University');
      const count = await University.countDocuments();
      this.universityId = `UNI-${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      const timestamp = Date.now().toString().slice(-6);
      this.universityId = `UNI-${timestamp}`;
    }
  }
  this.updatedAt = Date.now();
  next();
});

const University = mongoose.model('University', universitySchema);
export default University;