import { Counter, Faculty } from "../models/index.js";

export const generateFacultyId = async () => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const counter = await Counter.findOneAndUpdate(
      { _id: "facultyId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const candidate = `FAC-${String(counter.seq).padStart(3, "0")}`;
    const exists = await Faculty.findOne({ facultyId: candidate, isDeleted: { $ne: true } }).select("_id").lean();
    if (!exists) return candidate;
  }
  throw new Error("Could not generate a unique faculty ID after 10 attempts");
};
