import mongoose from 'mongoose';
import { handle } from '../utils/asyncHandler.js';
import { Program, ProgramCurriculum, Subject } from '../models/index.js';

const notDeleted = { $ne: true };
const CURRICULUM_TYPES = ['Core', 'Elective', 'Optional'];

async function findProgramByIdentifier(identifier) {
  const query = [{ programId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return Program.findOne({ $or: query, isDeleted: notDeleted });
}

function groupCurriculumBySemester(entries, duration) {
  const semesters = Array.from({ length: duration }, (_, i) => ({
    semester: i + 1,
    items: [],
    totalCredits: 0,
  }));

  for (const entry of entries) {
    const bucket = semesters.find((s) => s.semester === entry.semester);
    if (!bucket) continue;

    const credits = entry.subjectId?.credits || 0;
    bucket.items.push({
      _id: entry._id,
      subjectId: entry.subjectId,
      semester: entry.semester,
      type: entry.type,
      order: entry.order,
      status: entry.status,
    });
    bucket.totalCredits += credits;
  }

  for (const semester of semesters) {
    semester.items.sort((a, b) => a.order - b.order || String(a.subjectId?.code || '').localeCompare(String(b.subjectId?.code || '')));
  }

  const totalCredits = semesters.reduce((sum, s) => sum + s.totalCredits, 0);

  return {
    semesters,
    summary: {
      totalSubjects: entries.length,
      totalCredits,
    },
  };
}

export const getProgramCurriculum = handle(async (req, res) => {
  const program = await findProgramByIdentifier(req.params.id);
  if (!program) {
    return res.status(404).json({ success: false, message: 'Program not found' });
  }

  const populatedProgram = await Program.findById(program._id)
    .populate('departmentId', 'name code');

  const entries = await ProgramCurriculum.find({
    programId: program._id,
    isDeleted: notDeleted,
  })
    .populate({
      path: 'subjectId',
      select: 'code name credits status departmentId',
      populate: { path: 'departmentId', select: 'name code' },
    })
    .sort({ semester: 1, order: 1 })
    .select('-__v');

  const grouped = groupCurriculumBySemester(entries, program.duration || 8);

  res.json({
    success: true,
    data: {
      program: populatedProgram,
      ...grouped,
    },
  });
});

export const updateProgramCurriculum = handle(async (req, res) => {
  const program = await findProgramByIdentifier(req.params.id);
  if (!program) {
    return res.status(404).json({ success: false, message: 'Program not found' });
  }

  const { entries } = req.body;
  if (!Array.isArray(entries)) {
    return res.status(400).json({
      success: false,
      message: 'entries array is required',
    });
  }

  const maxSemester = program.duration || 8;
  const subjectIds = entries.map((e) => String(e.subjectId));
  const uniqueSubjectIds = new Set(subjectIds);
  if (uniqueSubjectIds.size !== subjectIds.length) {
    return res.status(400).json({
      success: false,
      message: 'Each subject can only appear once in a program curriculum',
    });
  }

  for (const entry of entries) {
    if (!entry.subjectId || !entry.semester) {
      return res.status(400).json({
        success: false,
        message: 'Each entry requires subjectId and semester',
      });
    }

    const semester = Number(entry.semester);
    if (!Number.isFinite(semester) || semester < 1 || semester > maxSemester) {
      return res.status(400).json({
        success: false,
        message: `Semester must be between 1 and ${maxSemester}`,
      });
    }

    if (entry.type && !CURRICULUM_TYPES.includes(entry.type)) {
      return res.status(400).json({
        success: false,
        message: `type must be one of: ${CURRICULUM_TYPES.join(', ')}`,
      });
    }
  }

  const subjects = await Subject.find({
    _id: { $in: [...uniqueSubjectIds] },
    isDeleted: notDeleted,
  }).select('_id departmentId code status');

  if (subjects.length !== uniqueSubjectIds.size) {
    return res.status(400).json({
      success: false,
      message: 'One or more subjects were not found',
    });
  }

  const inactive = subjects.filter((s) => s.status === 'Inactive');
  if (inactive.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Inactive subjects cannot be added to a curriculum',
      subjects: inactive.map((s) => s.code),
    });
  }

  const now = new Date();
  const deletedBy = req.user?._id || null;

  await ProgramCurriculum.updateMany(
    { programId: program._id, isDeleted: notDeleted },
    { isDeleted: true, deletedAt: now, deletedBy }
  );

  if (entries.length > 0) {
    const docs = entries.map((entry, index) => ({
      programId: program._id,
      subjectId: entry.subjectId,
      semester: Number(entry.semester),
      type: entry.type && CURRICULUM_TYPES.includes(entry.type) ? entry.type : 'Core',
      order: entry.order !== undefined ? Number(entry.order) : index + 1,
      status: entry.status === 'Inactive' ? 'Inactive' : 'Active',
    }));

    await ProgramCurriculum.insertMany(docs);
  }

  const saved = await ProgramCurriculum.find({
    programId: program._id,
    isDeleted: notDeleted,
  })
    .populate({
      path: 'subjectId',
      select: 'code name credits status departmentId',
      populate: { path: 'departmentId', select: 'name code' },
    })
    .sort({ semester: 1, order: 1 });

  const grouped = groupCurriculumBySemester(saved, program.duration || 8);

  res.json({
    success: true,
    message: 'Program curriculum updated successfully',
    data: {
      program,
      ...grouped,
    },
  });
});
