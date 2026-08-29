import { Counter } from "../models/index.js";

export const generateSubjectId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "subjectId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `SUB-${String(counter.seq).padStart(4, "0")}`;
};
