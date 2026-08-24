import mongoose from 'mongoose';
import { handle } from "../utils/asyncHandler.js";
import { Program, Department, Course } from '../models/index.js';
import { generateProgramId } from "../utils/generateProgramId.js";

async function findProgramByIdentifier(identifier) {
  const query = [{ programId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return Program.findOne({ $or: query, isDeleted: { $ne: true } });
}

export const getPrograms = handle(async (req, res) => {
  const { departmentId, degreeLevel, status, search, page = 1, limit = 10 } = req.query;
  const filter = { isDeleted: { $ne: true } };
  if (departmentId) filter.departmentId = departmentId;
  if (degreeLevel) filter.degreeLevel = degreeLevel;
  if (status) filter.status = status;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const programs = await Program.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ name: 1 })
    .populate('departmentId', 'name code')
    .select('-__v');

  const totalCount = await Program.countDocuments(filter);

  res.json({
    success: true,
    count: programs.length,
    total: totalCount,
    page: parseInt(page),
    totalPages: Math.ceil(totalCount / parseInt(limit)),
    data: programs
  });
});

export const getProgramById = handle(async (req, res) => {
  const program = await findProgramByIdentifier(req.params.id);

  if (!program) {
    return res.status(404).json({
      success: false,
      message: 'Program not found'
    });
  }

  const populated = await Program.findById(program._id)
    .populate('departmentId', 'name code');

  res.json({ success: true, data: populated });
});

export const createProgram = handle(async (req, res) => {
  const { name, code, departmentId, degreeLevel, duration, totalCredits, description } = req.body;

  if (!name || !code || !departmentId || !degreeLevel) {
    return res.status(400).json({
      success: false,
      message: 'name, code, departmentId and degreeLevel are required'
    });
  }

  // Verify department exists
  const dept = await Department.findOne({ _id: departmentId, isDeleted: { $ne: true } });
  if (!dept) {
    return res.status(400).json({
      success: false,
      message: `Department ${departmentId} not found`
    });
  }

  // Check for duplicate code
  const existing = await Program.findOne({ code: code.toUpperCase().trim(), isDeleted: { $ne: true } });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: `Program with code ${code} already exists`
    });
  }

  const programId = await generateProgramId();

  const program = new Program({
    programId,
    name: name.trim(),
    code: code.toUpperCase().trim(),
    departmentId,
    degreeLevel,
    duration: duration || 8,
    totalCredits: totalCredits || 0,
    description: description || ''
  });

  await program.save();

  const populated = await Program.findById(program._id)
    .populate('departmentId', 'name code');

  res.status(201).json({
    success: true,
    data: populated,
    message: 'Program created successfully'
  });
});

export const updateProgram = handle(async (req, res) => {
  const { id } = req.params;

  const program = await findProgramByIdentifier(id);
  if (!program) {
    return res.status(404).json({
      success: false,
      message: 'Program not found'
    });
  }

  if (req.body.code) {
    const trimmedCode = req.body.code.toUpperCase().trim();
    const existing = await Program.findOne({
      code: trimmedCode,
      _id: { $ne: program._id },
      isDeleted: { $ne: true }
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Program code already exists'
      });
    }
    program.code = trimmedCode;
  }

  if (req.body.departmentId) {
    const dept = await Department.findOne({ _id: req.body.departmentId, isDeleted: { $ne: true } });
    if (!dept) {
      return res.status(400).json({
        success: false,
        message: 'Department not found'
      });
    }
    program.departmentId = req.body.departmentId;
  }

  const { _id, isDeleted, deletedAt, deletedBy, createdAt, updatedAt, programId, ...updateData } = req.body;

  Object.assign(program, updateData);
  await program.save();

  const populated = await Program.findById(program._id)
    .populate('departmentId', 'name code');

  res.json({
    success: true,
    data: populated,
    message: 'Program updated successfully'
  });
});

export const deleteProgram = handle(async (req, res) => {
  const { id } = req.params;

  const program = await findProgramByIdentifier(id);
  if (!program) {
    return res.status(404).json({
      success: false,
      message: 'Program not found'
    });
  }

  // Check for courses using this program
  const courseCount = await Course.countDocuments({ program: program.code, isDeleted: { $ne: true } });
  if (courseCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete program with ${courseCount} courses. Remove courses first or deactivate the program.`,
      courseCount
    });
  }

  await program.deleteOne();

  res.json({
    success: true,
    message: 'Program deleted successfully'
  });
});

export const getProgramStats = handle(async (req, res) => {
  const stats = await Program.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    {
      $lookup: {
        from: 'courses',
        localField: 'code',
        foreignField: 'program',
        as: 'courses'
      }
    },
    {
      $project: {
        name: 1,
        code: 1,
        departmentId: 1,
        degreeLevel: 1,
        status: 1,
        courseCount: { $size: '$courses' },
        totalStudents: { $sum: '$courses.enrolledStudents' }
      }
    },
    { $sort: { courseCount: -1 } }
  ]);

  const totalPrograms = await Program.countDocuments({ isDeleted: { $ne: true } });
  const activePrograms = await Program.countDocuments({ status: 'Active', isDeleted: { $ne: true } });

  res.json({
    success: true,
    data: {
      total: totalPrograms,
      active: activePrograms,
      inactive: totalPrograms - activePrograms,
      programs: stats
    }
  });
});
