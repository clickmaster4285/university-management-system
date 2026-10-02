import { Counter } from '../models/index.js';

export const generateOfferingId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'offeringId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `OFF-${String(counter.seq).padStart(4, '0')}`;
};
