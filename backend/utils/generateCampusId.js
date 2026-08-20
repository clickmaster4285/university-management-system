import Counter from "../models/core/Counter.js";

export const generateCampusId = async (universityId) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: `campusId:${universityId}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `CMP-${String(counter.seq).padStart(3, "0")}`;
};