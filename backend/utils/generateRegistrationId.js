import { Counter } from '../models/index.js';

export const generateRegistrationId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'semesterRegistrationId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `SRG-${String(counter.seq).padStart(4, '0')}`;
};
