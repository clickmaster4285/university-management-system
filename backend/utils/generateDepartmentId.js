import { Counter } from "../models/index.js";

export const generateDepartmentId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "departmentId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `DEPT-${String(counter.seq).padStart(4, "0")}`;
};
