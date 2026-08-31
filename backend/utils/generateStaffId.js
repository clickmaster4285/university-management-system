import { Counter } from '../models/index.js';

export const generateStaffId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'staffId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `STF-${String(counter.seq).padStart(4, '0')}`;
};
