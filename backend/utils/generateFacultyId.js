import { Counter } from "../models/index.js";

export const generateFacultyId = async (campusId) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: `facultyId:${campusId}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `FAC-${String(counter.seq).padStart(3, "0")}`;
};
