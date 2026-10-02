import { Counter } from "../models/index.js";

export const generateProgramId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "programId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `PRG-${String(counter.seq).padStart(4, "0")}`;
};
