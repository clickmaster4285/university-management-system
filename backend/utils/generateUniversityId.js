import Counter from "../models/core/Counter.js";

export const generateUniversityId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "universityId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `UNI-${String(counter.seq).padStart(6, "0")}`;
};