/**
 * Seed CourseOfferings, Enrollments, Assignments, Exams, and sample Attendance.
 * Idempotent — safe to re-run after academic + staff/students seeds.
 *
 * Run: node scripts/seedOfferingsAssessments.js
 * Or via: npm run seed:all / npm run seed:offerings
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import {
  AcademicSession,
  Program,
  Batch,
  Subject,
  CourseOffering,
  Enrollment,
  Student,
  StaffMember,
  Assignment,
  Exam,
  Attendance,
} from '../models/index.js';
import { generateOfferingId } from '../utils/generateOfferingId.js';
import { buildEnrollmentFeeSnapshot } from '../utils/resolveSubjectFee.js';
import { resolveOfferingAcademicFields } from '../utils/resolveOfferingAcademicFields.js';
import {
  OFFERING_SEED_SESSION,
  OFFERING_SEED_PLAN,
  ASSESSMENT_TEMPLATES,
} from './seedData/offeringsAssessments.data.js';

dotenv.config();

const notDeleted = { $ne: true };

const emptyStats = () => ({
  offerings: { created: 0, reused: 0 },
  enrollments: { created: 0, reused: 0 },
  assignments: { created: 0, reused: 0 },
  exams: { created: 0, reused: 0 },
  attendance: { created: 0, reused: 0 },
  skipped: [],
  warnings: [],
});

async function ensureSession() {
  let session = await AcademicSession.findOne({
    $or: [
      { code: OFFERING_SEED_SESSION.code },
      { name: OFFERING_SEED_SESSION.name },
    ],
    isDeleted: notDeleted,
  });

  if (!session) {
    session = await AcademicSession.create({
      name: OFFERING_SEED_SESSION.name,
      code: OFFERING_SEED_SESSION.code,
      startDate: new Date(OFFERING_SEED_SESSION.startDate),
      endDate: new Date(OFFERING_SEED_SESSION.endDate),
      status: 'Active',
      isCurrent: true,
    });
  } else if (!session.isCurrent || session.status !== 'Active') {
    session.status = 'Active';
    session.isCurrent = true;
    await session.save();
  }

  return session;
}

async function pickInstructor(programId) {
  // Prefer academic staff; fall back to any academic
  const instructors = await StaffMember.find({
    isAcademic: true,
    isDeleted: notDeleted,
  })
    .select('_id firstName lastName')
    .limit(20)
    .lean();

  if (!instructors.length) return null;
  // Stable pick by program id hash so re-runs assign the same instructor
  const idx = Math.abs(String(programId).split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % instructors.length;
  return instructors[idx]._id;
}

async function ensureOffering({ subject, program, batch, session, semester }, stats) {
  let offering = await CourseOffering.findOne({
    subjectId: subject._id,
    batchId: batch._id,
    academicSessionId: session._id,
    isDeleted: notDeleted,
  });

  if (offering) {
    if (offering.status !== 'Active') {
      offering.status = 'Active';
      await offering.save();
    }
    stats.offerings.reused += 1;
    return offering;
  }

  const instructorId = await pickInstructor(program._id);
  offering = await CourseOffering.create({
    offeringId: await generateOfferingId(),
    subjectId: subject._id,
    programId: program._id,
    batchId: batch._id,
    academicSessionId: session._id,
    semester,
    instructorId,
    capacity: 40,
    enrolledStudents: 0,
    status: 'Active',
    schedule: {
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:30',
      room: 'R-101',
      building: 'Academic Block',
    },
  });
  stats.offerings.created += 1;
  return offering;
}

async function ensureEnrollment(offering, student, stats) {
  const existing = await Enrollment.findOne({
    studentId: student._id,
    offeringId: offering._id,
    status: 'Enrolled',
    isDeleted: notDeleted,
  });
  if (existing) {
    stats.enrollments.reused += 1;
    return existing;
  }

  const subject = await Subject.findById(offering.subjectId).select('credits');
  const feeResult = await buildEnrollmentFeeSnapshot({
    subjectId: offering.subjectId,
    programId: offering.programId,
    academicSessionId: offering.academicSessionId,
    credits: subject?.credits ?? 3,
    atDate: new Date(),
    feePolicy: 'current_rate',
  });

  if (feeResult.error) {
    stats.warnings.push(
      `Fee missing for ${offering.offeringId || offering._id}: ${feeResult.error}`
    );
    return null;
  }

  const enrollment = await Enrollment.create({
    studentId: student._id,
    offeringId: offering._id,
    feeSnapshot: feeResult.snapshot,
    feePolicyApplied: 'current_rate',
    status: 'Enrolled',
  });

  offering.enrolledStudents = (offering.enrolledStudents || 0) + 1;
  await offering.save();
  stats.enrollments.created += 1;
  return enrollment;
}

async function ensureAssignment(offering, resolved, stats) {
  const tpl = ASSESSMENT_TEMPLATES.assignment;
  const title = `${resolved.courseCode} — ${tpl.titleSuffix}`;

  const existing = await Assignment.findOne({
    offeringId: offering._id,
    title,
    isDeleted: notDeleted,
  });
  if (existing) {
    stats.assignments.reused += 1;
    return existing;
  }

  const due = new Date();
  due.setDate(due.getDate() + tpl.daysUntilDue);

  const assignment = await Assignment.create({
    title,
    description: tpl.description,
    offeringId: resolved.offeringId,
    subjectId: resolved.subjectId,
    programId: resolved.programId,
    batchId: resolved.batchId,
    academicSessionId: resolved.academicSessionId,
    course: resolved.course,
    courseCode: resolved.courseCode,
    department: resolved.department || 'N/A',
    program: resolved.program || 'N/A',
    semester: resolved.semester || offering.semester,
    academicYear: resolved.academicYear || OFFERING_SEED_SESSION.name,
    instructor: resolved.instructor || 'Unassigned',
    instructorEmail: resolved.instructorEmail || undefined,
    type: tpl.type,
    maxScore: tpl.maxScore,
    passingScore: tpl.passingScore,
    weightage: tpl.weightage,
    dueDate: due,
    submissionDeadline: due,
    status: tpl.status,
    allowLateSubmissions: false,
    lateSubmissionPenalty: 0,
    maxAttempts: 1,
    submissionType: 'File Upload',
    allowedFileTypes: ['pdf', 'doc', 'docx'],
    maxFileSize: 10485760,
  });
  stats.assignments.created += 1;
  return assignment;
}

async function ensureExam(offering, resolved, stats) {
  const tpl = ASSESSMENT_TEMPLATES.exam;
  const title = `${resolved.courseCode} — ${tpl.titleSuffix}`;

  const existing = await Exam.findOne({
    offeringId: offering._id,
    title,
    isDeleted: notDeleted,
  });
  if (existing) {
    stats.exams.reused += 1;
    return existing;
  }

  const examDate = new Date();
  examDate.setDate(examDate.getDate() + tpl.daysUntilExam);

  const exam = await Exam.create({
    title,
    type: tpl.type,
    offeringId: resolved.offeringId,
    subjectId: resolved.subjectId,
    programId: resolved.programId,
    batchId: resolved.batchId,
    academicSessionId: resolved.academicSessionId,
    course: resolved.course,
    courseCode: resolved.courseCode,
    department: resolved.department || 'N/A',
    program: resolved.program || 'N/A',
    semester: resolved.semester || offering.semester,
    academicYear: resolved.academicYear || OFFERING_SEED_SESSION.name,
    instructor: resolved.instructor || 'Unassigned',
    instructorEmail: resolved.instructorEmail || undefined,
    totalMarks: tpl.totalMarks,
    passingMarks: tpl.passingMarks,
    weightage: tpl.weightage,
    examDate,
    startTime: tpl.startTime,
    endTime: tpl.endTime,
    duration: tpl.duration,
    hall: tpl.hall,
    status: tpl.status,
    invigilators: [],
  });
  stats.exams.created += 1;
  return exam;
}

async function ensureAttendance(offering, resolved, student, status, stats) {
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  const next = new Date(day);
  next.setDate(next.getDate() + 1);

  const existing = await Attendance.findOne({
    studentId: student._id,
    offeringId: offering._id,
    date: { $gte: day, $lt: next },
    isDeleted: notDeleted,
  });
  if (existing) {
    stats.attendance.reused += 1;
    return existing;
  }

  const att = await Attendance.create({
    studentId: student._id,
    studentName: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student',
    studentEmail: student.email || 'student@example.com',
    offeringId: resolved.offeringId,
    subjectId: resolved.subjectId,
    programId: resolved.programId,
    batchId: resolved.batchId,
    academicSessionId: resolved.academicSessionId,
    courseCode: resolved.courseCode,
    course: resolved.course,
    program: resolved.program || student.program || '',
    semester: resolved.semester || student.semester || offering.semester,
    department: resolved.department || student.department || '',
    date: day,
    status,
    markedBy: 'Seed',
  });
  stats.attendance.created += 1;
  return att;
}

export async function seedOfferingsAssessments() {
  const stats = emptyStats();

  // Keep attendance indexes aligned with Phase 6 schema
  try {
    await Attendance.syncIndexes();
  } catch (err) {
    stats.warnings.push(`Attendance.syncIndexes: ${err.message}`);
  }

  const session = await ensureSession();
  console.log(`  Session: ${session.name} (${session.code})`);

  for (const plan of OFFERING_SEED_PLAN) {
    const program = await Program.findOne({
      code: plan.programCode,
      isDeleted: notDeleted,
    });
    if (!program) {
      stats.skipped.push(`Program ${plan.programCode} missing — run academic + staff seeds first`);
      continue;
    }

    const batch = await Batch.findOne({
      code: plan.batchCode,
      isDeleted: notDeleted,
    });
    if (!batch) {
      stats.skipped.push(`Batch ${plan.batchCode} missing — run staff/students seed first`);
      continue;
    }

    const students = await Student.find({
      programId: program._id,
      batchId: batch._id,
      semester: plan.semester,
      status: 'Active',
      isDeleted: notDeleted,
    });

    // Also match by currentSemester if semester field differs
    const moreStudents = await Student.find({
      programId: program._id,
      batchId: batch._id,
      currentSemester: plan.semester,
      status: 'Active',
      isDeleted: notDeleted,
      _id: { $nin: students.map((s) => s._id) },
    });
    const roster = [...students, ...moreStudents];

    for (const subjectCode of plan.subjectCodes) {
      const subject = await Subject.findOne({
        code: subjectCode,
        isDeleted: notDeleted,
      });
      if (!subject) {
        stats.skipped.push(`Subject ${subjectCode} missing — run seed:academic first`);
        continue;
      }

      const offering = await ensureOffering(
        { subject, program, batch, session, semester: plan.semester },
        stats
      );

      const resolved = await resolveOfferingAcademicFields(offering._id);
      if (!resolved) {
        stats.warnings.push(`Could not resolve fields for offering ${offering._id}`);
        continue;
      }

      for (const student of roster) {
        await ensureEnrollment(offering, student, stats);
      }

      // Re-load enrolled students if roster was empty (match by program+semester only)
      let enrolledStudents = roster;
      if (!enrolledStudents.length) {
        const enrollments = await Enrollment.find({
          offeringId: offering._id,
          status: 'Enrolled',
          isDeleted: notDeleted,
        }).populate('studentId');
        enrolledStudents = enrollments.map((e) => e.studentId).filter(Boolean);

        if (!enrolledStudents.length) {
          // Broad fallback: active students in same program + semester
          const fallback = await Student.find({
            programId: program._id,
            $or: [{ semester: plan.semester }, { currentSemester: plan.semester }],
            status: 'Active',
            isDeleted: notDeleted,
          }).limit(10);
          for (const student of fallback) {
            await ensureEnrollment(offering, student, stats);
          }
          enrolledStudents = fallback;
        }
      }

      await ensureAssignment(offering, resolved, stats);
      await ensureExam(offering, resolved, stats);

      // Sample attendance: first Present, second Absent, rest Late/Present alternating
      for (let i = 0; i < enrolledStudents.length; i += 1) {
        const status = i === 1 ? 'Absent' : i % 3 === 2 ? 'Late' : 'Present';
        await ensureAttendance(offering, resolved, enrolledStudents[i], status, stats);
      }
    }
  }

  return stats;
}

export function printOfferingsSeedReport(stats) {
  console.log('\n=== Offerings / assessments seed ===');
  const line = (label, bucket) =>
    console.log(
      `${label.padEnd(16)} created ${bucket.created}, reused ${bucket.reused}`
    );
  line('Offerings', stats.offerings);
  line('Enrollments', stats.enrollments);
  line('Assignments', stats.assignments);
  line('Exams', stats.exams);
  line('Attendance', stats.attendance);
  if (stats.skipped.length) {
    console.log('\nSkipped:');
    stats.skipped.forEach((s) => console.log(`  • ${s}`));
  }
  if (stats.warnings.length) {
    console.log('\nWarnings:');
    stats.warnings.forEach((w) => console.log(`  • ${w}`));
  }
  console.log('');
}

async function main() {
  console.log('🌱 Seeding offerings, enrollments, assignments, exams, attendance...\n');
  try {
    await connectDB();
    const stats = await seedOfferingsAssessments();
    printOfferingsSeedReport(stats);
    console.log('✅ Offerings / assessments seed complete');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

const isDirect =
  process.argv[1] &&
  (process.argv[1].includes('seedOfferingsAssessments') ||
    process.argv[1].replace(/\\/g, '/').endsWith('scripts/seedOfferingsAssessments.js'));

if (isDirect) {
  main();
}
