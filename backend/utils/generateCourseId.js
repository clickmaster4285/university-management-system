import { Counter } from "../models/index.js";

export const generateCourseId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "courseId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `CRS-${String(counter.seq).padStart(4, "0")}`;
};
