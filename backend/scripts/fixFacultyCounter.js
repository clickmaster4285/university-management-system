/**
 * One-time fix: sync the facultyId counter to the highest existing FAC-XXX number.
 * Run: node scripts/fixFacultyCounter.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Counter, Faculty } from "../models/index.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function run() {
  if (!MONGO_URI) {
    console.error("Set MONGO_URI or MONGODB_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const faculties = await Faculty.find({ isDeleted: { $ne: true } })
    .select("facultyId")
    .lean();

  let maxSeq = 0;
  for (const f of faculties) {
    const match = f.facultyId?.match(/^FAC-(\d+)$/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  console.log(`Found ${faculties.length} faculties, highest FAC number: FAC-${String(maxSeq).padStart(3, "0")}`);

  const counter = await Counter.findOneAndUpdate(
    { _id: "facultyId" },
    { $set: { seq: maxSeq } },
    { new: true, upsert: true }
  );

  console.log(`Counter set to ${counter.seq}. Next faculty will be FAC-${String(counter.seq + 1).padStart(3, "0")}`);

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
