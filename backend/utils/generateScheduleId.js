import { Counter } from '../models/index.js';

export const generateScheduleId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'programSemesterFeeScheduleId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `PFS-${String(counter.seq).padStart(4, '0')}`;
};
