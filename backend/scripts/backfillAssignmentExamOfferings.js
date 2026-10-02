/**
 * Best-effort backfill: link Assignment/Exam rows to CourseOffering by courseCode.
 * Leaves offeringId null when zero or multiple Active matches (ambiguous).
 *
 * Run: node scripts/backfillAssignmentExamOfferings.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Assignment, Exam, CourseOffering, Subject } from '../models/index.js';
import { resolveOfferingAcademicFields } from '../utils/resolveOfferingAcademicFields.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function findUniqueActiveOffering(courseCode, semester, programName) {
  if (!courseCode) return null;

  const subjects = await Subject.find({
    code: courseCode,
    isDeleted: { $ne: true },
  }).select('_id');

  if (subjects.length === 0) return null;

  const subjectIds = subjects.map((s) => s._id);
  const query = {
    subjectId: { $in: subjectIds },
    status: 'Active',
    isDeleted: { $ne: true },
  };
  if (semester) query.semester = Number(semester);

  let offerings = await CourseOffering.find(query)
    .populate('programId', 'name code')
    .lean();

  if (programName && offerings.length > 1) {
    const filtered = offerings.filter((o) => {
      const p = o.programId;
      if (!p) return false;
      const name = (p.name || '').toLowerCase();
      const code = (p.code || '').toLowerCase();
      const needle = programName.toLowerCase();
      return name.includes(needle) || code.includes(needle) || needle.includes(code);
    });
    if (filtered.length === 1) offerings = filtered;
  }

  if (offerings.length === 1) return offerings[0]._id;
  return null;
}

async function backfillCollection(Model, label) {
  const rows = await Model.find({
    isDeleted: { $ne: true },
    $or: [{ offeringId: null }, { offeringId: { $exists: false } }],
  });

  let linked = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const offeringMongoId = await findUniqueActiveOffering(
        row.courseCode,
        row.semester,
        row.program
      );

      if (!offeringMongoId) {
        skipped += 1;
        continue;
      }

      const resolved = await resolveOfferingAcademicFields(offeringMongoId);
      if (!resolved) {
        skipped += 1;
        continue;
      }

      row.offeringId = resolved.offeringId;
      row.subjectId = resolved.subjectId;
      row.programId = resolved.programId;
      row.batchId = resolved.batchId;
      row.academicSessionId = resolved.academicSessionId;
      // Keep existing legacy strings; only fill blanks
      if (!row.course && resolved.course) row.course = resolved.course;
      if (!row.courseCode && resolved.courseCode) row.courseCode = resolved.courseCode;
      if (!row.department && resolved.department) row.department = resolved.department;
      if (!row.program && resolved.program) row.program = resolved.program;
      if (!row.academicYear && resolved.academicYear) row.academicYear = resolved.academicYear;
      if (!row.instructor && resolved.instructor) row.instructor = resolved.instructor;

      await row.save();
      linked += 1;
    } catch (err) {
      failed += 1;
      console.error(`  Failed ${label} ${row._id}:`, err.message);
    }
  }

  console.log(
    `${label}: total without offering=${rows.length}, linked=${linked}, skipped(ambiguous/none)=${skipped}, failed=${failed}`
  );
}

async function run() {
  if (!MONGO_URI) {
    console.error('Set MONGO_URI or MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  await backfillCollection(Assignment, 'Assignment');
  await backfillCollection(Exam, 'Exam');

  await mongoose.disconnect();
  console.log('Done');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
