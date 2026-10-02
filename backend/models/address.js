import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      required: [true, "Street address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    province: {
      type: String,
      required: [true, "Province is required"],
      trim: true,
    },
    country: {
      type: String,
      default: "Pakistan",
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

export default addressSchema;