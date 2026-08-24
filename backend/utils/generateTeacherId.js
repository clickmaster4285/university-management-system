import { Counter } from "../models/index.js";

export const generateTeacherId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "teacherId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `FAC-${String(counter.seq).padStart(4, "0")}`;
};
