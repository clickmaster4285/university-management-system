/**
 * Drop legacy Attendance unique index { studentId, date } and sync new
 * { studentId, date, offeringId } unique index.
 *
 * Run once after deploying Phase 6 attendance schema:
 *   node scripts/syncAttendanceIndexes.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Attendance from '../models/Attendance.model.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function run() {
  if (!MONGO_URI) {
    console.error('Set MONGO_URI or MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const collection = mongoose.connection.collection('attendances');
  const indexes = await collection.indexes();
  console.log('Current indexes:', indexes.map((i) => i.name));

  for (const idx of indexes) {
    const keys = Object.keys(idx.key || {});
    // Drop old unique { studentId: 1, date: 1 } without offeringId
    if (
      idx.unique &&
      keys.length === 2 &&
      keys.includes('studentId') &&
      keys.includes('date') &&
      !keys.includes('offeringId')
    ) {
      console.log(`Dropping legacy index: ${idx.name}`);
      await collection.dropIndex(idx.name);
    }
  }

  console.log('Syncing Attendance indexes from schema...');
  await Attendance.syncIndexes();
  const after = await collection.indexes();
  console.log('Indexes after sync:', after.map((i) => i.name));

  await mongoose.disconnect();
  console.log('Done');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
