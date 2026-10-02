import mongoose from 'mongoose';
import { handle } from '../utils/asyncHandler.js';
import {
  Program,
  AcademicSession,
  ProgramSemesterFeeSchedule,
  SCHEDULE_STATUSES,
  STUDENT_CATEGORIES,
} from '../models/index.js';
import { generateScheduleId } from '../utils/generateScheduleId.js';
import { buildSubjectLinesForSemester, computeScheduleTotals } from '../utils/buildSemesterFeeSchedule.js';
import { parseLocalDate } from '../utils/parseLocalDate.js';

const notDeleted = { $ne: true };

async function findProgramByIdentifier(identifier) {
  const query = [{ programId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return Program.findOne({ $or: query, isDeleted: notDeleted });
}

async function findScheduleByIdentifier(identifier) {
  const query = [{ scheduleId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return ProgramSemesterFeeSchedule.findOne({ $or: query, isDeleted: notDeleted });
}

function populateSchedule(query) {
  return query
    .populate('programId', 'name code duration')
    .populate('academicSessionId', 'name code isCurrent')
    .populate('generatedBy', 'name email')
    .populate('activatedBy', 'name email');
}

function applyTotals(schedule) {
  const totals = computeScheduleTotals({
    subjectLines: schedule.subjectLines,
    additionalFees: schedule.additionalFees,
    discount: schedule.discount,
  });
  Object.assign(schedule, totals);
  return schedule;
}

function subjectLinesFingerprint(lines = []) {
  return lines
    .map((line) => `${line.subjectId}:${line.feePerCredit}:${line.lineTotal}`)
    .sort()
    .join('|');
}

async function buildLivePreview(schedule, atDate = new Date()) {
  const programId = schedule.programId?._id || schedule.programId;
  const { subjectLines, warnings } = await buildSubjectLinesForSemester(
    programId,
    schedule.semester,
    atDate
  );
  const totals = computeScheduleTotals({
    subjectLines,
    additionalFees: schedule.additionalFees,
    discount: schedule.discount,
  });
  return {
    subjectLines,
    warnings,
    ...totals,
    ratesStale: subjectLinesFingerprint(schedule.subjectLines) !== subjectLinesFingerprint(subjectLines),
    resolvedAt: parseLocalDate(atDate),
  };
}

function scheduleScopeFilter({ programId, semester, academicSessionId, studentCategory }) {
  return {
    programId,
    semester,
    academicSessionId,
    studentCategory: studentCategory || 'Regular',
    isDeleted: notDeleted,
  };
}

export const listProgramSemesterFeeSchedules = handle(async (req, res) => {
  const programId = req.params.id || req.params.programId || req.query.programId;
  const { academicSessionId, semester, status, studentCategory } = req.query;
  const filter = { isDeleted: notDeleted };

  if (programId) filter.programId = programId;
  if (academicSessionId) filter.academicSessionId = academicSessionId;
  if (semester) filter.semester = parseInt(semester, 10);
  if (status) filter.status = status;
  if (studentCategory) filter.studentCategory = studentCategory;

  const schedules = await populateSchedule(
    ProgramSemesterFeeSchedule.find(filter).sort({ semester: 1, createdAt: -1 })
  );

  res.json({
    success: true,
    count: schedules.length,
    data: schedules,
  });
});

export const getProgramSemesterFeeScheduleById = handle(async (req, res) => {
  const found = await findScheduleByIdentifier(req.params.id);
  if (!found) {
    return res.status(404).json({ success: false, message: 'Fee schedule not found' });
  }

  const schedule = await populateSchedule(ProgramSemesterFeeSchedule.findById(found._id));
  const payload = schedule.toObject ? schedule.toObject() : schedule;

  if (req.query.live === '1' || req.query.live === 'true') {
    const livePreview = await buildLivePreview(schedule);
    return res.json({ success: true, data: { ...payload, livePreview } });
  }

  res.json({ success: true, data: payload });
});

export const generateProgramSemesterFeeSchedules = handle(async (req, res) => {
  const program = await findProgramByIdentifier(
    req.params.id || req.params.programId || req.body.programId
  );
  if (!program) {
    return res.status(404).json({ success: false, message: 'Program not found' });
  }

  const {
    academicSessionId,
    semester,
    studentCategory = 'Regular',
    effectiveFrom,
    additionalFees,
    notes,
    atDate,
  } = req.body;

  if (!academicSessionId) {
    return res.status(400).json({ success: false, message: 'academicSessionId is required' });
  }

  const session = await AcademicSession.findById(academicSessionId);
  if (!session) {
    return res.status(400).json({ success: false, message: 'Academic session not found' });
  }

  if (!STUDENT_CATEGORIES.includes(studentCategory)) {
    return res.status(400).json({
      success: false,
      message: `studentCategory must be one of: ${STUDENT_CATEGORIES.join(', ')}`,
    });
  }

  const generationDate = atDate ? parseLocalDate(atDate) : new Date();
  const semestersToBuild = semester
    ? [parseInt(semester, 10)]
    : Array.from({ length: program.duration || 8 }, (_, i) => i + 1);

  const created = [];
  const updated = [];
  const allWarnings = [];

  for (const sem of semestersToBuild) {
    const { subjectLines, warnings } = await buildSubjectLinesForSemester(
      program._id,
      sem,
      generationDate
    );

    if (subjectLines.length === 0) {
      allWarnings.push({ semester: sem, message: 'No active curriculum subjects for this semester' });
      continue;
    }

    const scope = scheduleScopeFilter({
      programId: program._id,
      semester: sem,
      academicSessionId,
      studentCategory,
    });

    let schedule = await ProgramSemesterFeeSchedule.findOne({
      ...scope,
      status: 'Draft',
    });

    const preservedAdditionalFees =
      schedule?.additionalFees?.length
        ? schedule.additionalFees
        : additionalFees || [];

    const schedulePayload = {
      programId: program._id,
      semester: sem,
      academicSessionId,
      studentCategory,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : generationDate,
      subjectLines,
      additionalFees: preservedAdditionalFees,
      warnings,
      notes: notes || schedule?.notes || '',
      generatedAt: new Date(),
      generatedBy: req.user?._id || null,
      status: 'Draft',
    };

    if (schedule) {
      Object.assign(schedule, schedulePayload);
      applyTotals(schedule);
      await schedule.save();
      updated.push(schedule);
    } else {
      if (!schedulePayload.scheduleId) {
        schedulePayload.scheduleId = await generateScheduleId();
      }
      schedule = new ProgramSemesterFeeSchedule(schedulePayload);
      applyTotals(schedule);
      await schedule.save();
      created.push(schedule);
    }

    if (warnings.length) {
      allWarnings.push({ semester: sem, warnings });
    }
  }

  const populated = await populateSchedule(
    ProgramSemesterFeeSchedule.find({
      _id: { $in: [...created, ...updated].map((s) => s._id) },
    }).sort({ semester: 1 })
  );

  res.status(201).json({
    success: true,
    message: `Generated ${created.length + updated.length} schedule(s)`,
    data: populated,
    meta: {
      created: created.length,
      updated: updated.length,
      warnings: allWarnings,
    },
  });
});

export const refreshProgramSemesterFeeScheduleRates = handle(async (req, res) => {
  const schedule = await findScheduleByIdentifier(req.params.id);
  if (!schedule) {
    return res.status(404).json({ success: false, message: 'Fee schedule not found' });
  }

  if (schedule.status === 'Archived') {
    return res.status(400).json({ success: false, message: 'Archived schedules cannot be refreshed' });
  }

  const atDate = req.body?.atDate ? parseLocalDate(req.body.atDate) : new Date();
  const programId = schedule.programId?._id || schedule.programId;
  const { subjectLines, warnings } = await buildSubjectLinesForSemester(
    programId,
    schedule.semester,
    atDate
  );

  schedule.subjectLines = subjectLines;
  schedule.warnings = warnings;
  schedule.generatedAt = new Date();
  schedule.generatedBy = req.user?._id || null;
  applyTotals(schedule);
  await schedule.save();

  const populated = await populateSchedule(ProgramSemesterFeeSchedule.findById(schedule._id));
  const payload = populated.toObject ? populated.toObject() : populated;
  const livePreview = await buildLivePreview(populated, atDate);

  res.json({
    success: true,
    message: 'Semester package updated to current subject fee rates',
    data: { ...payload, livePreview },
  });
});

export const updateProgramSemesterFeeSchedule = handle(async (req, res) => {
  const schedule = await findScheduleByIdentifier(req.params.id);
  if (!schedule) {
    return res.status(404).json({ success: false, message: 'Fee schedule not found' });
  }

  if (schedule.status === 'Archived') {
    return res.status(400).json({
      success: false,
      message: 'Archived schedules cannot be edited',
    });
  }

  const { additionalFees, discount, notes, effectiveFrom, effectiveTo } = req.body;

  if (additionalFees !== undefined) {
    schedule.additionalFees = additionalFees;
  }
  if (discount !== undefined) {
    schedule.discount = discount;
  }
  if (notes !== undefined) {
    schedule.notes = notes;
  }
  if (effectiveFrom !== undefined) {
    schedule.effectiveFrom = new Date(effectiveFrom);
  }
  if (effectiveTo !== undefined) {
    schedule.effectiveTo = effectiveTo ? new Date(effectiveTo) : null;
  }

  applyTotals(schedule);
  await schedule.save();

  const populated = await populateSchedule(ProgramSemesterFeeSchedule.findById(schedule._id));

  res.json({
    success: true,
    message: 'Fee schedule updated',
    data: populated,
  });
});

export const activateProgramSemesterFeeSchedule = handle(async (req, res) => {
  const schedule = await findScheduleByIdentifier(req.params.id);
  if (!schedule) {
    return res.status(404).json({ success: false, message: 'Fee schedule not found' });
  }

  if (schedule.status === 'Active') {
    return res.json({
      success: true,
      message: 'Schedule is already active',
      data: schedule,
    });
  }

  if (schedule.subjectLines.some((line) => line.missingRate)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot activate: some subjects are missing fee rates',
      data: { warnings: schedule.warnings },
    });
  }

  const scope = scheduleScopeFilter({
    programId: schedule.programId,
    semester: schedule.semester,
    academicSessionId: schedule.academicSessionId,
    studentCategory: schedule.studentCategory,
  });

  await ProgramSemesterFeeSchedule.updateMany(
    { ...scope, status: 'Active', _id: { $ne: schedule._id } },
    {
      $set: {
        status: 'Archived',
        effectiveTo: new Date(),
      },
    }
  );

  schedule.status = 'Active';
  schedule.activatedAt = new Date();
  schedule.activatedBy = req.user?._id || null;
  if (!schedule.effectiveFrom) {
    schedule.effectiveFrom = new Date();
  }
  await schedule.save();

  const populated = await populateSchedule(ProgramSemesterFeeSchedule.findById(schedule._id));

  res.json({
    success: true,
    message: 'Fee schedule activated',
    data: populated,
  });
});

export const archiveProgramSemesterFeeSchedule = handle(async (req, res) => {
  const schedule = await findScheduleByIdentifier(req.params.id);
  if (!schedule) {
    return res.status(404).json({ success: false, message: 'Fee schedule not found' });
  }

  schedule.status = 'Archived';
  schedule.effectiveTo = new Date();
  await schedule.save();

  res.json({
    success: true,
    message: 'Fee schedule archived',
    data: schedule,
  });
});

export const deleteProgramSemesterFeeSchedule = handle(async (req, res) => {
  const schedule = await findScheduleByIdentifier(req.params.id);
  if (!schedule) {
    return res.status(404).json({ success: false, message: 'Fee schedule not found' });
  }

  if (schedule.status === 'Active') {
    return res.status(400).json({
      success: false,
      message: 'Active schedules must be archived before deletion',
    });
  }

  schedule.isDeleted = true;
  schedule.deletedAt = new Date();
  await schedule.save();

  res.json({
    success: true,
    message: 'Fee schedule deleted',
  });
});

export const getProgramSemesterFeeScheduleStats = handle(async (req, res) => {
  const program = await findProgramByIdentifier(req.params.id || req.params.programId);
  if (!program) {
    return res.status(404).json({ success: false, message: 'Program not found' });
  }

  const { academicSessionId } = req.query;
  const filter = { programId: program._id, isDeleted: notDeleted };
  if (academicSessionId) filter.academicSessionId = academicSessionId;

  const schedules = await ProgramSemesterFeeSchedule.find(filter).select(
    'semester status netPayable totalSubjectFee subjectLines'
  );

  const bySemester = Array.from({ length: program.duration || 8 }, (_, i) => {
    const sem = i + 1;
    const row = schedules.filter((s) => s.semester === sem);
    const active = row.find((s) => s.status === 'Active');
    const draft = row.find((s) => s.status === 'Draft');
    return {
      semester: sem,
      hasSchedule: row.length > 0,
      status: active?.status || draft?.status || null,
      subjectCount: active?.subjectLines?.length || draft?.subjectLines?.length || 0,
      netPayable: active?.netPayable ?? draft?.netPayable ?? null,
    };
  });

  res.json({
    success: true,
    data: {
      programId: program._id,
      totalSchedules: schedules.length,
      activeCount: schedules.filter((s) => s.status === 'Active').length,
      draftCount: schedules.filter((s) => s.status === 'Draft').length,
      bySemester,
    },
  });
});
