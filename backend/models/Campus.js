import mongoose from "mongoose";

const campusSchema = new mongoose.Schema({
  // Tenant Reference (University)
  universityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    required: [true, 'University ID is required'],
    index: true,
  },
  
  // Campus Identification
  campusId: {
    type: String,
    unique: true,
  },
  campusCode: {
    type: String,
    required: [true, 'Campus code is required'],
    uppercase: true,
    trim: true,
  },
  
  // Basic Information
  name: {
    type: String,
    required: [true, 'Campus name is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['Main Campus', 'Branch', 'City Campus', 'Regional Campus'],
    default: 'Branch',
  },
  isMainCampus: {
    type: Boolean,
    default: false,
  },
  
  // Location
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
    },
    province: {
      type: String,
      required: [true, 'Province is required'],
    },
    country: {
      type: String,
      default: 'Pakistan',
    },
    postalCode: {
      type: String,
    },
  },
  
  // Contact
  phone: {
    type: String,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  
  // Additional
  establishedYear: {
    type: Number,
  },
  description: {
    type: String,
    trim: true,
  },
  
  // Status
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Under Construction'],
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

// Ensure unique campus code within a university
campusSchema.index({ universityId: 1, campusCode: 1 }, { unique: true });
campusSchema.index({ universityId: 1, name: 1 }, { unique: true });

// Generate Campus ID before saving
campusSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Campus = mongoose.model('Campus');
      const count = await Campus.countDocuments({ 
        universityId: this.universityId 
      });
      this.campusId = `CMP-${String(count + 1).padStart(3, '0')}`;
    } catch (error) {
      const timestamp = Date.now().toString().slice(-4);
      this.campusId = `CMP-${timestamp}`;
    }
  }
  this.updatedAt = Date.now();
  next();
});

const Campus = mongoose.model('Campus', campusSchema);
export default Campus;