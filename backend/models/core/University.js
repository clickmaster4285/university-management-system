import mongoose from "mongoose";
import address from "../shared/address.js";
import academicSettings from "../shared/academicSettings.js";

const universitySchema = new mongoose.Schema(
  {
    universityId: {
      type: String,
      unique: true,
      required: [true, "University ID is required"],
    },
    universityName: {
      type: String,
      required: [true, "University name is required"],
      trim: true,
    },
    universityCode: {
      type: String,
      required: [true, "University code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    shortName: {
      type: String,
      required: [true, "Short name is required"],
      uppercase: true,
      trim: true,
    },
    universityType: {
      type: String,
      enum: ["Public", "Private", "Semi-Government"],
      default: "Private",
    },
    registrationNumber: {
      type: String,
      trim: true,
    },
    officialEmail: {
      type: String,
      required: [true, "Official email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[+\d][\d\s-]{6,}$/, "Please provide a valid phone number"],
    },
    website: {
      type: String,
      trim: true,
      match: [/^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/, "Please provide a valid URL"],
    },
    address: address,
    academicSettings: academicSettings,
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },
    isActive: {
      type: Boolean,
      default: true,
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
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const University = mongoose.model("University", universitySchema);
export default University;