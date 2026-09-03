import mongoose from 'mongoose';
import { handle } from "../utils/asyncHandler.js";
import { Program, Department, CourseOffering, Batch, ProgramCurriculum, Subject } from '../models/index.js';
import { generateProgramId } from "../utils/generateProgramId.js";

const DEGREE_LEVELS = ['BS', 'MS', 'PhD', 'BBA', 'MBA', 'LLB', 'Other'];
const notDeleted = { $ne: true };

async function findProgramByIdentifier(identifier) {
  const query = [{ programId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return Program.findOne({ $or: query, isDeleted: notDeleted });
}

function offeringLinkFilter(program) {
  return {
    isDeleted: notDeleted,
    programId: program._id,
  };
}

function batchLinkFilter(program) {
  return {
    isDeleted: notDeleted,
    $or: [
      { programId: program._id.toString() },
      { programId: program.programId },
      { program: program.code },
    ],
  };
}

export const getPrograms = handle(async (req, res) => {
  const { departmentId, degreeLevel, status, search, page = 1, limit = 100 } = req.query;
  const filter = { isDeleted: notDeleted };
  if (departmentId) filter.departmentId = departmentId;
  if (degreeLevel) filter.degreeLevel = degreeLevel;
  if (status) filter.status = status;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { programId: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const programs = await Program.find(filter)
    .skip(skip)
    .limit(parseInt(limit, 10))
    .sort({ name: 1 })
    .populate('departmentId', 'name code')
    .select('-__v');

  const totalCount = await Program.countDocuments(filter);

  res.json({
    success: true,
    count: programs.length,
    total: totalCount,
    page: parseInt(page, 10),
    totalPages: Math.ceil(totalCount / parseInt(limit, 10)),
    data: programs,
  });
});

export const getProgramById = handle(async (req, res) => {
  const program = await findProgramByIdentifier(req.params.id);

  if (!program) {
    return res.status(404).json({
      success: false,
      message: 'Program not found',
    });
  }

  const populated = await Program.findById(program._id)
    .populate('departmentId', 'name code');

  const pid = program._id;

  const [totalBatches, totalOfferings, totalEnrolledStudents, totalCurriculumEntries, totalSubjects] = await Promise.all([
    Batch.countDocuments({ programId: pid, isDeleted: notDeleted }),
    CourseOffering.countDocuments({ programId: pid, isDeleted: notDeleted }),
    CourseOffering.aggregate([
      { $match: { programId: pid, isDeleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: "$enrolledStudents" } } },
    ]).then(r => r[0]?.total || 0),
    ProgramCurriculum.countDocuments({ programId: pid, isDeleted: notDeleted }),
    Subject.countDocuments({ departmentId: program.departmentId?._id || program.departmentId, isDeleted: notDeleted }),
  ]);

  const data = populated.toObject();
  data.stats = {
    totalBatches,
    totalOfferings,
    totalEnrolledStudents,
    totalCurriculumEntries,
    totalSubjects,
  };

  res.json({ success: true, data });
});

export const createProgram = handle(async (req, res) => {
  const {
    name,
    code,
    departmentId,
    degreeLevel,
    duration,
    totalCredits,
    description,
    status,
  } = req.body;

  if (!name || !code || !departmentId || !degreeLevel) {
    return res.status(400).json({
      success: false,
      message: 'name, code, departmentId and degreeLevel are required',
    });
  }

  if (!DEGREE_LEVELS.includes(degreeLevel)) {
    return res.status(400).json({
      success: false,
      message: `degreeLevel must be one of: ${DEGREE_LEVELS.join(', ')}`,
    });
  }

  const dept = await Department.findOne({ _id: departmentId, isDeleted: notDeleted });
  if (!dept) {
    return res.status(400).json({
      success: false,
      message: `Department ${departmentId} not found`,
    });
  }

  const trimmedCode = code.toUpperCase().trim();
  const duplicate = await Program.findOne({ code: trimmedCode });
  if (duplicate) {
    const message = duplicate.isDeleted
      ? 'A program with this code was previously deleted. Use a different code.'
      : `Program with code ${trimmedCode} already exists`;
    return res.status(duplicate.isDeleted ? 409 : 400).json({ success: false, message });
  }

  const displayId = await generateProgramId();

  const program = new Program({
    programId: displayId,
    name: name.trim(),
    code: trimmedCode,
    departmentId,
    degreeLevel,
    duration: duration ? Number(duration) : 8,
    totalCredits: totalCredits ? Number(totalCredits) : 0,
    description: description || '',
    status: status || 'Active',
  });

  await program.save();

  const populated = await Program.findById(program._id)
    .populate('departmentId', 'name code');

  res.status(201).json({
    success: true,
    data: populated,
    message: 'Program created successfully',
  });
});

export const updateProgram = handle(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    code,
    departmentId,
    degreeLevel,
    duration,
    totalCredits,
    description,
    status,
  } = req.body;

  const program = await findProgramByIdentifier(id);
  if (!program) {
    return res.status(404).json({
      success: false,
      message: 'Program not found',
    });
  }

  if (name !== undefined && name !== '') {
    program.name = name.trim();
  }

  if (code !== undefined && code !== '') {
    const trimmedCode = code.toUpperCase().trim();
    const duplicate = await Program.findOne({
      code: trimmedCode,
      _id: { $ne: program._id },
    });
    if (duplicate) {
      const message = duplicate.isDeleted
        ? 'A program with this code was previously deleted. Use a different code.'
        : 'Program code already exists';
      return res.status(duplicate.isDeleted ? 409 : 400).json({ success: false, message });
    }
    program.code = trimmedCode;
  }

  if (departmentId !== undefined && departmentId !== '') {
    const dept = await Department.findOne({ _id: departmentId, isDeleted: notDeleted });
    if (!dept) {
      return res.status(400).json({
        success: false,
        message: 'Department not found',
      });
    }
    program.departmentId = departmentId;
  }

  if (degreeLevel !== undefined && degreeLevel !== '') {
    if (!DEGREE_LEVELS.includes(degreeLevel)) {
      return res.status(400).json({
        success: false,
        message: `degreeLevel must be one of: ${DEGREE_LEVELS.join(', ')}`,
      });
    }
    program.degreeLevel = degreeLevel;
  }

  if (duration !== undefined) program.duration = Number(duration) || 8;
  if (totalCredits !== undefined) program.totalCredits = Number(totalCredits) || 0;
  if (description !== undefined) program.description = description;
  if (status !== undefined && status !== '') program.status = status;

  await program.save();

  const populated = await Program.findById(program._id)
    .populate('departmentId', 'name code');

  res.json({
    success: true,
    data: populated,
    message: 'Program updated successfully',
  });
});

export const deleteProgram = handle(async (req, res) => {
  const { id } = req.params;

  const program = await findProgramByIdentifier(id);
  if (!program) {
    return res.status(404).json({
      success: false,
      message: 'Program not found',
    });
  }

  const [offeringCount, batchCount, curriculumCount] = await Promise.all([
    CourseOffering.countDocuments(offeringLinkFilter(program)),
    Batch.countDocuments(batchLinkFilter(program)),
    ProgramCurriculum.countDocuments({ programId: program._id, isDeleted: notDeleted }),
  ]);

  if (offeringCount > 0 || batchCount > 0 || curriculumCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete program while offerings, batches, or curriculum entries are still linked. Remove or reassign them first, or deactivate the program.',
      offeringCount,
      batchCount,
      curriculumCount,
    });
  }

  const now = new Date();
  const deletedBy = req.user?._id || null;

  await program.updateOne({
    isDeleted: true,
    deletedAt: now,
    deletedBy,
  });

  res.json({
    success: true,
    message: 'Program deleted successfully',
  });
});

export const getProgramStats = handle(async (req, res) => {
  const stats = await Program.aggregate([
    { $match: { isDeleted: notDeleted } },
    {
      $lookup: {
        from: 'courseofferings',
        let: { programObjectId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$programId', '$$programObjectId'] },
              isDeleted: notDeleted,
            },
          },
        ],
        as: 'offerings',
      },
    },
    {
      $lookup: {
        from: 'batches',
        let: { programObjectId: { $toString: '$_id' }, programDisplayId: '$programId', programCode: '$code' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ['$programId', '$$programObjectId'] },
                  { $eq: ['$programId', '$$programDisplayId'] },
                  { $eq: ['$program', '$$programCode'] },
                ],
              },
              isDeleted: notDeleted,
            },
          },
        ],
        as: 'batches',
      },
    },
    {
      $project: {
        name: 1,
        code: 1,
        departmentId: 1,
        degreeLevel: 1,
        status: 1,
        offeringCount: { $size: '$offerings' },
        batchCount: { $size: '$batches' },
        totalStudents: { $sum: '$offerings.enrolledStudents' },
      },
    },
    { $sort: { offeringCount: -1 } },
  ]);

  const totalPrograms = await Program.countDocuments({ isDeleted: notDeleted });
  const activePrograms = await Program.countDocuments({ status: 'Active', isDeleted: notDeleted });

  res.json({
    success: true,
    data: {
      total: totalPrograms,
      active: activePrograms,
      inactive: totalPrograms - activePrograms,
      programs: stats,
    },
  });
});
