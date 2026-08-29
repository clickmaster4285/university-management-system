import mongoose from 'mongoose';
import { handle } from '../utils/asyncHandler.js';
import {
  CourseOffering,
  Enrollment,
  Subject,
  Program,
  Batch,
  AcademicSession,
  Teacher,
  Student,
  ProgramCurriculum,
  OFFERING_STATUSES,
} from '../models/index.js';
import { generateOfferingId } from '../utils/generateOfferingId.js';
import { buildEnrollmentFeeSnapshot } from '../utils/resolveSubjectFee.js';

const notDeleted = { $ne: true };

const offeringPopulate = [
  { path: 'subjectId', select: 'subjectId code name credits departmentId' },
  { path: 'programId', select: 'programId code name' },
  { path: 'batchId', select: 'batchId code year program' },
  { path: 'academicSessionId', select: 'sessionId name year status' },
  { path: 'instructorId', select: 'teacherId name email' },
];

async function findOfferingByIdentifier(identifier) {
  const query = [{ offeringId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return CourseOffering.findOne({ $or: query, isDeleted: notDeleted });
}

function batchMatchesProgram(batch, program) {
  const programId = program._id.toString();
  return (
    batch.programId === programId
    || batch.programId === program.programId
    || batch.program === program.code
  );
}

async function validateOfferingRefs({ subjectId, programId, batchId, academicSessionId, instructorId }) {
  const [subject, program, batch, session] = await Promise.all([
    Subject.findOne({ _id: subjectId, isDeleted: notDeleted }),
    Program.findOne({ _id: programId, isDeleted: notDeleted }),
    Batch.findOne({ _id: batchId, isDeleted: notDeleted }),
    AcademicSession.findOne({ _id: academicSessionId, isDeleted: notDeleted }),
  ]);

  if (!subject) return { status: 400, message: 'Subject not found' };
  if (!program) return { status: 400, message: 'Program not found' };
  if (!batch) return { status: 400, message: 'Batch not found' };
  if (!session) return { status: 400, message: 'Academic session not found' };

  if (!batchMatchesProgram(batch, program)) {
    return { status: 400, message: 'Batch does not belong to the selected program' };
  }

  if (instructorId) {
    const instructor = await Teacher.findOne({ _id: instructorId, isDeleted: notDeleted });
    if (!instructor) return { status: 400, message: 'Instructor not found' };
  }

  return { subject, program, batch, session };
}

export const getOfferings = handle(async (req, res) => {
  const {
    programId,
    batchId,
    academicSessionId,
    subjectId,
    status,
    semester,
    search,
    page = 1,
    limit = 100,
  } = req.query;

  const filter = { isDeleted: notDeleted };
  if (programId) filter.programId = programId;
  if (batchId) filter.batchId = batchId;
  if (academicSessionId) filter.academicSessionId = academicSessionId;
  if (subjectId) filter.subjectId = subjectId;
  if (status) filter.status = status;
  if (semester) filter.semester = parseInt(semester, 10);

  const parsedLimit = parseInt(limit, 10);
  const parsedPage = parseInt(page, 10);
  const skip = (parsedPage - 1) * parsedLimit;

  let query = CourseOffering.find(filter)
    .skip(skip)
    .limit(parsedLimit)
    .sort({ createdAt: -1 })
    .populate(offeringPopulate)
    .select('-__v');

  if (search) {
    const subjectMatches = await Subject.find({
      isDeleted: notDeleted,
      $or: [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');

    const subjectIds = subjectMatches.map((s) => s._id);
    query = CourseOffering.find({
      ...filter,
      $or: [
        { offeringId: { $regex: search, $options: 'i' } },
        ...(subjectIds.length ? [{ subjectId: { $in: subjectIds } }] : []),
      ],
    })
      .skip(skip)
      .limit(parsedLimit)
      .sort({ createdAt: -1 })
      .populate(offeringPopulate)
      .select('-__v');
  }

  const [offerings, totalCount] = await Promise.all([
    query,
    search
      ? CourseOffering.countDocuments({
        ...filter,
        $or: [
          { offeringId: { $regex: search, $options: 'i' } },
        ],
      })
      : CourseOffering.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: offerings.length,
    total: totalCount,
    page: parsedPage,
    totalPages: Math.ceil(totalCount / parsedLimit),
    data: offerings,
  });
});

export const getOfferingStats = handle(async (req, res) => {
  const base = { isDeleted: notDeleted };
  const [total, active, draft, completed] = await Promise.all([
    CourseOffering.countDocuments(base),
    CourseOffering.countDocuments({ ...base, status: 'Active' }),
    CourseOffering.countDocuments({ ...base, status: 'Draft' }),
    CourseOffering.countDocuments({ ...base, status: 'Completed' }),
  ]);

  const enrollmentAgg = await Enrollment.aggregate([
    { $match: { isDeleted: false, status: 'Enrolled' } },
    { $group: { _id: null, total: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    data: {
      total,
      active,
      draft,
      completed,
      totalEnrollments: enrollmentAgg[0]?.total || 0,
    },
  });
});

export const getOfferingById = handle(async (req, res) => {
  const offering = await findOfferingByIdentifier(req.params.id);
  if (!offering) {
    return res.status(404).json({ success: false, message: 'Offering not found' });
  }

  const populated = await CourseOffering.findById(offering._id)
    .populate(offeringPopulate)
    .select('-__v');

  res.json({ success: true, data: populated });
});

export const createOffering = handle(async (req, res) => {
  const {
    subjectId,
    programId,
    batchId,
    academicSessionId,
    semester,
    instructorId,
    schedule,
    capacity,
    status,
  } = req.body;

  if (!subjectId || !programId || !batchId || !academicSessionId || !semester) {
    return res.status(400).json({
      success: false,
      message: 'subjectId, programId, batchId, academicSessionId and semester are required',
    });
  }

  const validation = await validateOfferingRefs({
    subjectId,
    programId,
    batchId,
    academicSessionId,
    instructorId,
  });
  if (validation.message) {
    return res.status(validation.status).json({ success: false, message: validation.message });
  }

  const curriculumEntry = await ProgramCurriculum.findOne({
    programId,
    subjectId,
    semester: parseInt(semester, 10),
    isDeleted: notDeleted,
  });
  if (!curriculumEntry) {
    return res.status(400).json({
      success: false,
      message: 'Subject is not in this program curriculum for the selected semester',
    });
  }

  const duplicate = await CourseOffering.findOne({
    subjectId,
    batchId,
    academicSessionId,
    isDeleted: notDeleted,
  });
  if (duplicate) {
    return res.status(409).json({
      success: false,
      message: 'An offering for this subject, batch and session already exists',
    });
  }

  if (status && !OFFERING_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${OFFERING_STATUSES.join(', ')}`,
    });
  }

  const offeringId = await generateOfferingId();
  const offering = await CourseOffering.create({
    offeringId,
    subjectId,
    programId,
    batchId,
    academicSessionId,
    semester: parseInt(semester, 10),
    instructorId: instructorId || null,
    schedule: schedule || undefined,
    capacity: capacity ?? 30,
    status: status || 'Active',
  });

  const populated = await CourseOffering.findById(offering._id)
    .populate(offeringPopulate)
    .select('-__v');

  res.status(201).json({ success: true, data: populated });
});

export const updateOffering = handle(async (req, res) => {
  const offering = await findOfferingByIdentifier(req.params.id);
  if (!offering) {
    return res.status(404).json({ success: false, message: 'Offering not found' });
  }

  const {
    instructorId,
    schedule,
    capacity,
    status,
    semester,
  } = req.body;

  if (status && !OFFERING_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${OFFERING_STATUSES.join(', ')}`,
    });
  }

  if (instructorId) {
    const instructor = await Teacher.findOne({ _id: instructorId, isDeleted: notDeleted });
    if (!instructor) {
      return res.status(400).json({ success: false, message: 'Instructor not found' });
    }
    offering.instructorId = instructorId;
  } else if (instructorId === null) {
    offering.instructorId = null;
  }

  if (schedule !== undefined) offering.schedule = schedule;
  if (capacity !== undefined) offering.capacity = capacity;
  if (status !== undefined) offering.status = status;
  if (semester !== undefined) offering.semester = parseInt(semester, 10);

  await offering.save();

  const populated = await CourseOffering.findById(offering._id)
    .populate(offeringPopulate)
    .select('-__v');

  res.json({ success: true, data: populated });
});

export const deleteOffering = handle(async (req, res) => {
  const offering = await findOfferingByIdentifier(req.params.id);
  if (!offering) {
    return res.status(404).json({ success: false, message: 'Offering not found' });
  }

  const activeEnrollments = await Enrollment.countDocuments({
    offeringId: offering._id,
    status: 'Enrolled',
    isDeleted: notDeleted,
  });
  if (activeEnrollments > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete offering with active enrollments',
    });
  }

  offering.isDeleted = true;
  offering.deletedAt = new Date();
  offering.deletedBy = req.user?._id || null;
  await offering.save();

  res.json({ success: true, message: 'Offering deleted' });
});

export const getOfferingEnrollments = handle(async (req, res) => {
  const offering = await findOfferingByIdentifier(req.params.id);
  if (!offering) {
    return res.status(404).json({ success: false, message: 'Offering not found' });
  }

  const enrollments = await Enrollment.find({
    offeringId: offering._id,
    isDeleted: notDeleted,
  })
    .populate('studentId', 'studentId name email program department status')
    .sort({ enrolledAt: -1 })
    .select('-__v');

  res.json({ success: true, count: enrollments.length, data: enrollments });
});

export const enrollStudentInOffering = handle(async (req, res) => {
  const offering = await findOfferingByIdentifier(req.params.id);
  if (!offering) {
    return res.status(404).json({ success: false, message: 'Offering not found' });
  }

  if (offering.status !== 'Active') {
    return res.status(400).json({
      success: false,
      message: 'Students can only enroll in active offerings',
    });
  }

  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({ success: false, message: 'studentId is required' });
  }

  const student = await Student.findOne({ _id: studentId, isDeleted: notDeleted });
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  if (student.status !== 'Active') {
    return res.status(400).json({
      success: false,
      message: 'Only active students can be enrolled',
    });
  }

  const existing = await Enrollment.findOne({
    studentId,
    offeringId: offering._id,
    status: 'Enrolled',
    isDeleted: notDeleted,
  });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'Student is already enrolled in this offering',
    });
  }

  if (offering.enrolledStudents >= offering.capacity) {
    return res.status(400).json({
      success: false,
      message: 'Offering is at full capacity',
    });
  }

  const subject = await Subject.findById(offering.subjectId).select('credits');
  if (!subject) {
    return res.status(400).json({ success: false, message: 'Subject not found for offering' });
  }

  const feeResult = await buildEnrollmentFeeSnapshot({
    subjectId: offering.subjectId,
    programId: offering.programId,
    academicSessionId: offering.academicSessionId,
    credits: subject.credits,
    atDate: new Date(),
    feePolicy: 'current_rate',
  });

  if (feeResult.error) {
    return res.status(400).json({ success: false, message: feeResult.error });
  }

  const enrollment = await Enrollment.create({
    studentId,
    offeringId: offering._id,
    feeSnapshot: feeResult.snapshot,
    feePolicyApplied: 'current_rate',
    status: 'Enrolled',
  });

  offering.enrolledStudents += 1;
  await offering.save();

  const populated = await Enrollment.findById(enrollment._id)
    .populate('studentId', 'studentId name email program department status')
    .populate('offeringId', 'offeringId semester status')
    .select('-__v');

  res.status(201).json({ success: true, data: populated });
});

export const dropStudentFromOffering = handle(async (req, res) => {
  const offering = await findOfferingByIdentifier(req.params.id);
  if (!offering) {
    return res.status(404).json({ success: false, message: 'Offering not found' });
  }

  const { studentId } = req.params;
  const enrollment = await Enrollment.findOne({
    studentId,
    offeringId: offering._id,
    status: 'Enrolled',
    isDeleted: notDeleted,
  });

  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: 'Active enrollment not found for this student',
    });
  }

  enrollment.status = 'Dropped';
  await enrollment.save();

  offering.enrolledStudents = Math.max(0, offering.enrolledStudents - 1);
  await offering.save();

  res.json({ success: true, message: 'Student dropped from offering' });
});
