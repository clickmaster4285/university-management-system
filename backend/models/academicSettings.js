import mongoose from "mongoose";

const academicSettingsSchema = new mongoose.Schema(
  {
    academicSystem: {
      type: String,
      enum: ["Semester", "Quarter", "Annual"],
      default: "Semester",
    },
    gradingSystem: {
      type: String,
      enum: ["GPA", "Percentage", "Letter Grade"],
      default: "GPA",
    },
    maxGPA: {
      type: Number,
      default: 4.0,
      min: 0.5,
    },
    passingGPA: {
      type: Number,
      default: 2.0,
      min: 0,
      validate: {
        validator: function (value) {
          if (this.gradingSystem !== "GPA") return true;
          return this.maxGPA == null || value <= this.maxGPA;
        },
        message: "passingGPA cannot be greater than maxGPA for GPA-based grading",
      },
    },
  },
  { _id: false }
);

export default academicSettingsSchema;