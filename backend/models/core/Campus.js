import mongoose from "mongoose";
import address from "../shared/address.js";

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
    required: [true, 'Campus ID is required'],
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
  address: address,
  
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
}, { timestamps: true });

// Ensure unique campus code and ID within a university
campusSchema.index({ universityId: 1, campusCode: 1 }, { unique: true });
campusSchema.index({ universityId: 1, name: 1 }, { unique: true });
campusSchema.index({ universityId: 1, campusId: 1 }, { unique: true });

const Campus = mongoose.model('Campus', campusSchema);
export default Campus;