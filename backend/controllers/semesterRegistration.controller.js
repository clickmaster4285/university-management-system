import mongoose from 'mongoose';
import { handle } from '../utils/asyncHandler.js';
import {
  Student,
  Program,
  Batch,
  AcademicSession,
  ProgramSemesterFeeSchedule,
  CourseOffering,
  Enrollment,
  Fee,
  SemesterRegistration,
  REGISTRATION_MODES,
  REGISTRATION_STATUSES,
} from '../models/index.js';
import { generateRegistrationId } from '../utils/generateRegistrationId.js';
import { buildSemesterFeeSnapshotFromSchedule } from '../utils/buildSemesterRegistrationSnapshot.js';
import { buildChallanFromRegistration } from '../utils/buildChallanFromRegistration.js';

const notDeleted = { $ne: true };

async function findByIdentifier(Model, identifier, idField) {
  const query = [{ [idField]: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return Model.findOne({ $or: query, isDeleted: notDeleted });
}

function populateRegistration(query) {
  return query
    .populate('studentId', 'studentId firstName lastName name email program programId department departmentId campusId batchId currentSemester semester status')
    .populate('programId', 'name code duration')
    .populate('batchId', 'code program year status')
    .populate('academicSessionId', 'name code isCurrent')
    .populate('enrollmentIds')
    .populate('registeredBy', 'name email');
}

async function resolveActiveSchedule({
  programId,
  programSemester,
  academicSessionId,
  studentCategory = 'Regular',
}) {
  return ProgramSemesterFeeSchedule.findOne({
    programId,
    semester: programSemester,
    academicSessionId,
    studentCategory: studentCategory || 'Regular',
    status: 'Active',
    isDeleted: notDeleted,
  });
}

async function validateRegistrationInput(body) {
  const {
    studentId,
    programId,
    batchId,
    academicSessionId,
    programSemester,
    registrationMode = 'package',
    studentCategory = 'Regular',
  } = body;

  if (!studentId || !programId || !batchId || !academicSessionId || !programSemester) {
    return {
      error: 'studentId, programId, batchId, academicSessionId, and programSemester are required',
    };
  }

  if (!REGISTRATION_MODES.includes(registrationMode)) {
    return { error: `registrationMode must be one of: ${REGISTRATION_MODES.join(', ')}` };
  }

  const semesterNum = parseInt(programSemester, 10);
  if (Number.isNaN(semesterNum) || semesterNum < 1) {
    return { error: 'programSemester must be a positive number' };
  }

  const [student, program, batch, session] = await Promise.all([
    findByIdentifier(Student, studentId, 'studentId'),
    findByIdentifier(Program, programId, 'programId'),
    findByIdentifier(Batch, batchId, 'batchId'),
    findByIdentifier(AcademicSession, academicSessionId, 'sessionId'),
  ]);

  if (!student) return { error: 'Student not found' };
  if (!program) return { error: 'Program not found' };
  if (!batch) return { error: 'Batch not found' };
  if (!session) return { error: 'Academic session not found' };

  if (student.status && student.status !== 'Active') {
    return { error: 'Student must be Active to register for a semester' };
  }

  const programCode = program.code?.toUpperCase();
  const studentProgramId = student.programId?.toString?.() || student.programId;
  if (studentProgramId && studentProgramId !== program._id.toString()) {
    return {
      error: `Student program does not match selected program (${program.code})`,
    };
  }
  if (!studentProgramId && student.program && programCode && student.program.toUpperCase() !== programCode) {
    return {
      error: `Student program (${student.program}) does not match selected program (${program.code})`,
    };
  }

  const batchProgramId = batch.programId?.toString?.() || batch.programId;
  if (batchProgramId && batchProgramId !== program._id.toString() && batch.program !== program.code) {
    return { error: 'Batch does not belong to the selected program' };
  }

  const schedule = await resolveActiveSchedule({
    programId: program._id,
    programSemester: semesterNum,
    academicSessionId: session._id,
    studentCategory,
  });

  if (!schedule && registrationMode === 'package') {
    return {
      error: `No active fee package found for ${program.code} semester ${semesterNum} in this session`,
    };
  }

  return {
    student,
    program,
    batch,
    session,
    schedule,
    semesterNum,
    registrationMode,
    studentCategory,
  };
}

async function syncPackageEnrollments({
  studentId,
  batchId,
  academicSessionId,
  programSemester,
  schedule,
  createEnrollments = true,
}) {
  const enrollmentIds = [];
  const warnings = [];

  if (!schedule?.subjectLines?.length) {
    return { enrollmentIds, warnings };
  }

  const subjectIds = schedule.subjectLines.map((line) => line.subjectId);
  const offerings = await CourseOffering.find({
    subjectId: { $in: subjectIds },
    batchId,
    academicSessionId,
    semester: programSemester,
    isDeleted: notDeleted,
    status: { $in: ['Active', 'Draft'] },
  });

  const offeringBySubject = new Map(
    offerings.map((offering) => [offering.subjectId.toString(), offering])
  );

  for (const line of schedule.subjectLines) {
    const subjectKey = line.subjectId?.toString?.() || String(line.subjectId);
    const offering = offeringBySubject.get(subjectKey);

    if (!offering) {
      warnings.push({
        subjectId: line.subjectId,
        code: line.code,
        message: `No offering found for ${line.code || 'subject'} — create offering first or enroll manually`,
      });
      continue;
    }

    let enrollment = await Enrollment.findOne({
      studentId,
      offeringId: offering._id,
      isDeleted: notDeleted,
      status: 'Enrolled',
    });

    if (!enrollment && createEnrollments) {
      if (line.missingRate || !line.subjectFeeHistoryId) {
        warnings.push({
          code: line.code,
          message: `Skipped ${line.code}: missing fee rate in package`,
        });
        continue;
      }

      if (offering.enrolledStudents >= offering.capacity) {
        warnings.push({
          code: line.code,
          message: `Offering for ${line.code} is at full capacity`,
        });
        continue;
      }

      const feeSnapshot = {
        subjectFeeHistoryId: line.subjectFeeHistoryId,
        feePolicy: 'package',
        credits: line.credits,
        feePerCredit: line.feePerCredit,
        totalFee: line.lineTotal,
        feeType: line.feeType || 'Tuition',
        academicSessionId,
        lockedAt: new Date(),
      };

      enrollment = await Enrollment.create({
        studentId,
        offeringId: offering._id,
        feeSnapshot,
        feePolicyApplied: 'package',
        status: 'Enrolled',
      });

      offering.enrolledStudents += 1;
      await offering.save();
    }

    if (enrollment) {
      enrollmentIds.push(enrollment._id);
    }
  }

  return { enrollmentIds, warnings };
}

export const listSemesterRegistrations = handle(async (req, res) => {
  const {
    studentId,
    programId,
    batchId,
    academicSessionId,
    programSemester,
    status,
    registrationMode,
  } = req.query;

  const filter = { isDeleted: notDeleted };
  if (studentId) filter.studentId = studentId;
  if (programId) filter.programId = programId;
  if (batchId) filter.batchId = batchId;
  if (academicSessionId) filter.academicSessionId = academicSessionId;
  if (programSemester) filter.programSemester = parseInt(programSemester, 10);
  if (status) filter.status = status;
  if (registrationMode) filter.registrationMode = registrationMode;

  const registrations = await populateRegistration(
    SemesterRegistration.find(filter).sort({ registeredAt: -1, createdAt: -1 })
  );

  res.json({
    success: true,
    count: registrations.length,
    data: registrations,
  });
});

export const getSemesterRegistrationById = handle(async (req, res) => {
  const found = await findByIdentifier(SemesterRegistration, req.params.id, 'registrationId');
  if (!found) {
    return res.status(404).json({ success: false, message: 'Semester registration not found' });
  }

  const registration = await populateRegistration(
    SemesterRegistration.findById(found._id)
  );

  res.json({ success: true, data: registration });
});

export const listStudentSemesterRegistrations = handle(async (req, res) => {
  const student = await findByIdentifier(Student, req.params.id, 'studentId');
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  const registrations = await populateRegistration(
    SemesterRegistration.find({ studentId: student._id, isDeleted: notDeleted }).sort({
      registeredAt: -1,
    })
  );

  res.json({
    success: true,
    count: registrations.length,
    data: registrations,
  });
});

export const previewSemesterRegistration = handle(async (req, res) => {
  const validated = await validateRegistrationInput(req.body);
  if (validated.error) {
    return res.status(400).json({ success: false, message: validated.error });
  }

  const {
    student,
    program,
    batch,
    session,
    schedule,
    semesterNum,
    registrationMode,
    studentCategory,
  } = validated;

  const existing = await SemesterRegistration.findOne({
    studentId: student._id,
    batchId: batch._id,
    academicSessionId: session._id,
    programSemester: semesterNum,
    isDeleted: notDeleted,
    status: { $ne: 'Dropped' },
  });

  const semesterFeeSnapshot = schedule ? buildSemesterFeeSnapshotFromSchedule(schedule) : null;

  const { enrollmentIds, warnings } = schedule
    ? await syncPackageEnrollments({
        studentId: student._id,
        batchId: batch._id,
        academicSessionId: session._id,
        programSemester: semesterNum,
        schedule,
        createEnrollments: false,
      })
    : { enrollmentIds: [], warnings: [] };

  res.json({
    success: true,
    data: {
      student: {
        _id: student._id,
        studentId: student.studentId,
        name: student.fullName || student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        programId: student.programId,
        program: student.program,
        semester: student.currentSemester || student.semester,
      },
      program: { _id: program._id, name: program.name, code: program.code },
      batch: { _id: batch._id, code: batch.code, program: batch.program },
      academicSession: { _id: session._id, name: session.name, code: session.code },
      programSemester: semesterNum,
      registrationMode,
      studentCategory,
      schedule: schedule
        ? {
            _id: schedule._id,
            scheduleId: schedule.scheduleId,
            status: schedule.status,
            netPayable: schedule.netPayable,
            subjectCount: schedule.subjectLines?.length || 0,
          }
        : null,
      semesterFeeSnapshot,
      existingRegistration: existing
        ? { _id: existing._id, registrationId: existing.registrationId, status: existing.status }
        : null,
      linkedEnrollmentCount: enrollmentIds.length,
      warnings,
    },
  });
});

export const createSemesterRegistration = handle(async (req, res) => {
  const validated = await validateRegistrationInput(req.body);
  if (validated.error) {
    return res.status(400).json({ success: false, message: validated.error });
  }

  const {
    student,
    program,
    batch,
    session,
    schedule,
    semesterNum,
    registrationMode,
    studentCategory,
  } = validated;

  const existing = await SemesterRegistration.findOne({
    studentId: student._id,
    batchId: batch._id,
    academicSessionId: session._id,
    programSemester: semesterNum,
    isDeleted: notDeleted,
    status: { $ne: 'Dropped' },
  });

  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'Student is already registered for this semester in this batch and session',
      data: { registrationId: existing.registrationId, _id: existing._id },
    });
  }

  const semesterFeeSnapshot = buildSemesterFeeSnapshotFromSchedule(schedule);
  const { enrollmentIds, warnings } = await syncPackageEnrollments({
    studentId: student._id,
    batchId: batch._id,
    academicSessionId: session._id,
    programSemester: semesterNum,
    schedule,
    createEnrollments: true,
  });

  const registrationId = await generateRegistrationId();
  const registration = await SemesterRegistration.create({
    registrationId,
    studentId: student._id,
    programId: program._id,
    batchId: batch._id,
    academicSessionId: session._id,
    programSemester: semesterNum,
    registrationMode,
    studentCategory,
    semesterFeeSnapshot,
    enrollmentIds,
    status: 'Registered',
    registeredBy: req.user?._id || null,
    warnings,
    notes: req.body.notes || '',
  });

  const populated = await populateRegistration(
    SemesterRegistration.findById(registration._id)
  );

  res.status(201).json({
    success: true,
    data: populated,
    warnings,
  });
});

export const generateSemesterRegistrationChallan = handle(async (req, res) => {
  const found = await findByIdentifier(SemesterRegistration, req.params.id, 'registrationId');
  if (!found) {
    return res.status(404).json({ success: false, message: 'Semester registration not found' });
  }

  if (found.status === 'Dropped') {
    return res.status(400).json({ success: false, message: 'Cannot generate challan for a dropped registration' });
  }

  if (found.feeId) {
    const existing = await Fee.findById(found.feeId);
    if (existing && !existing.isDeleted) {
      return res.status(409).json({
        success: false,
        message: 'Challan already exists for this registration',
        data: { feeId: existing.feeId, _id: existing._id },
      });
    }
  }

  const registration = await populateRegistration(SemesterRegistration.findById(found._id));
  const student = registration.studentId;
  if (!student || !student._id) {
    return res.status(400).json({ success: false, message: 'Student not found for registration' });
  }

  const { dueDate, dueDays, notes } = req.body || {};
  const challanData = buildChallanFromRegistration(registration, student, { dueDate, dueDays, notes });
  challanData.createdBy = req.user?._id || null;

  const fee = await Fee.create(challanData);

  registration.feeId = fee._id;
  if (registration.status === 'Registered') {
    registration.status = 'Registered';
  }
  await registration.save();

  const populatedFee = await Fee.findById(fee._id).populate(
    'semesterRegistrationId',
    'registrationId programSemester status'
  );

  res.status(201).json({
    success: true,
    data: {
      challan: populatedFee,
      registration: await populateRegistration(SemesterRegistration.findById(registration._id)),
    },
    message: 'Challan generated successfully',
  });
});

export const dropSemesterRegistration = handle(async (req, res) => {
  const found = await findByIdentifier(SemesterRegistration, req.params.id, 'registrationId');
  if (!found) {
    return res.status(404).json({ success: false, message: 'Semester registration not found' });
  }

  if (found.status === 'Dropped') {
    return res.status(400).json({ success: false, message: 'Registration is already dropped' });
  }

  if (found.status === 'Paid' || found.status === 'Partial') {
    return res.status(400).json({
      success: false,
      message: 'Cannot drop a registration with payment recorded — handle via finance first',
    });
  }

  found.status = 'Dropped';
  await found.save();

  const populated = await populateRegistration(
    SemesterRegistration.findById(found._id)
  );

  res.json({ success: true, data: populated });
});

export const getSemesterRegistrationStats = handle(async (req, res) => {
  const { academicSessionId, programId, batchId } = req.query;
  const match = { isDeleted: notDeleted, status: { $ne: 'Dropped' } };
  if (academicSessionId) match.academicSessionId = new mongoose.Types.ObjectId(academicSessionId);
  if (programId) match.programId = new mongoose.Types.ObjectId(programId);
  if (batchId) match.batchId = new mongoose.Types.ObjectId(batchId);

  const [total, byStatus, revenue] = await Promise.all([
    SemesterRegistration.countDocuments(match),
    SemesterRegistration.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    SemesterRegistration.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          expectedRevenue: { $sum: '$semesterFeeSnapshot.netPayable' },
        },
      },
    ]),
  ]);

  const statusCounts = Object.fromEntries(
    REGISTRATION_STATUSES.map((s) => [s, 0])
  );
  byStatus.forEach((row) => {
    statusCounts[row._id] = row.count;
  });

  res.json({
    success: true,
    data: {
      total,
      byStatus: statusCounts,
      expectedRevenue: revenue[0]?.expectedRevenue || 0,
    },
  });
});
