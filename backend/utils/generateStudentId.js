import { Counter } from '../models/index.js';

export const generateStudentId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'studentId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `STU-${String(counter.seq).padStart(4, '0')}`;
};

export const generateApplicationId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'studentApplicationId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const year = new Date().getFullYear().toString().slice(-2);
  return `APP-${year}-${String(counter.seq).padStart(4, '0')}`;
};

export const generateAdmissionDossierId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'studentAdmissionId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const year = new Date().getFullYear().toString().slice(-2);
  return `ADM-${year}-${String(counter.seq).padStart(4, '0')}`;
};
