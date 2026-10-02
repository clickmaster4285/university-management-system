// backend/src/controllers/batch.controller.js
import mongoose from 'mongoose';
import { handle } from "../utils/asyncHandler.js";

// GET /api/batches - Get all batches
import { AcademicSession, Batch, Department } from '../models/index.js';
export const getBatches = handle(async (req, res) => {
  const { departmentId, program, status, admissionSessionId } = req.query;
  const filter = { isDeleted: { $ne: true } };
  
  if (departmentId) {
    filter.departmentId = departmentId;
  }
  
  if (program) {
    filter.program = program;
  }
  
  if (status) {
    filter.status = status;
  }

  if (admissionSessionId) {
    filter.admissionSessionId = admissionSessionId;
  }
  
  const batches = await Batch.find(filter)
    .sort({ year: -1, program: 1 })
    .populate('departmentId', 'name code')
    .populate('admissionSessionId', 'name')
    .select('-__v');
  
  res.json({
    success: true,
    count: batches.length,
    data: batches
  });
});

// Helper function to find batch by identifier
async function findBatchByIdentifier(identifier) {
  const query = [{ batchId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return Batch.findOne({ $or: query, isDeleted: { $ne: true } });
}

// GET /api/batches/:id - Get batch by ID
export const getBatchById = handle(async (req, res) => {
  const batch = await findBatchByIdentifier(req.params.id);
  
  if (!batch) {
    return res.status(404).json({
      success: false,
      message: 'Batch not found'
    });
  }

  const populated = await Batch.findById(batch._id)
    .populate('departmentId', 'name code')
    .populate('admissionSessionId', 'name');
  
  res.json({ success: true, data: populated });
});

// GET /api/batches/stats - Get batch statistics
export const getBatchStats = handle(async (req, res) => {
  const total = await Batch.countDocuments({ isDeleted: { $ne: true } });
  const active = await Batch.countDocuments({ status: 'Active', isDeleted: { $ne: true } });
  const upcoming = await Batch.countDocuments({ status: 'Upcoming', isDeleted: { $ne: true } });
  const completed = await Batch.countDocuments({ status: 'Completed', isDeleted: { $ne: true } });
  const inactive = await Batch.countDocuments({ status: 'Inactive', isDeleted: { $ne: true } });
  
  // Group by department
  const byDepartment = await Batch.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        department: '$_id',
        count: 1,
        _id: 0
      }
    },
    { $sort: { department: 1 } }
  ]);
  
  // Group by program
  const byProgram = await Batch.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    {
      $group: {
        _id: '$program',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        program: '$_id',
        count: 1,
        _id: 0
      }
    },
    { $sort: { program: 1 } }
  ]);
  
  res.json({
    success: true,
    data: {
      total,
      active,
      upcoming,
      completed,
      inactive,
      byDepartment,
      byProgram
    }
  });
});

// POST /api/batches - Create new batch
export const createBatch = handle(async (req, res) => {
  const { 
    year,
    code,
    department,
    departmentId,
    program,
    programId,
    admissionSession,
    admissionSessionId,
    admissionSemester,
    expectedGraduation,
    status,
    description
  } = req.body;
  
  
  // Validate required fields
  if (!year || !code || !departmentId || !program || !admissionSessionId) {
    return res.status(400).json({
      success: false,
      message: 'Year, code, department, program, and admission session are required'
    });
  }
  
  // Check if department exists
  const dept = await Department.findOne({ _id: departmentId, isDeleted: { $ne: true } });
  if (!dept) {
    return res.status(404).json({
      success: false,
      message: 'Department not found'
    });
  }
  
  // Check if admission session exists
  const session = await AcademicSession.findOne({ _id: admissionSessionId, isDeleted: { $ne: true } });
  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Admission session not found'
    });
  }
  
  // Check for existing batch with same code
  const existing = await Batch.findOne({ code: code.toUpperCase().trim(), isDeleted: { $ne: true } });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'Batch with this code already exists'
    });
  }
  
  // Create new batch
  const batch = new Batch({
    year,
    code: code.toUpperCase().trim(),
    department: dept.name,
    departmentId,
    program: program.trim(),
    programId: programId || program,
    admissionSession: session.name,
    admissionSessionId,
    admissionSemester: admissionSemester || 'Fall',
    expectedGraduation: expectedGraduation || year + 4,
    status: status || 'Upcoming',
    description: description || ''
  });
  
  await batch.save();
  
  
  res.status(201).json({
    success: true,
    data: batch,
    message: 'Batch created successfully'
  });
});

// PUT /api/batches/:id - Update batch
export const updateBatch = handle(async (req, res) => {
  const { id } = req.params;
  const { 
    year,
    code,
    department,
    departmentId,
    program,
    programId,
    admissionSession,
    admissionSessionId,
    admissionSemester,
    expectedGraduation,
    status,
    description
  } = req.body;
  
  
  // Find the batch
  const batch = await findBatchByIdentifier(id);
  if (!batch) {
    return res.status(404).json({
      success: false,
      message: 'Batch not found'
    });
  }
  
  // Update fields if provided
  if (year !== undefined) {
    batch.year = year;
  }
  
  if (code !== undefined && code !== '') {
    const trimmedCode = code.toUpperCase().trim();
    const existing = await Batch.findOne({ 
      code: trimmedCode, 
      _id: { $ne: batch._id },
      isDeleted: { $ne: true }
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Batch code already exists'
      });
    }
    batch.code = trimmedCode;
  }
  
  if (departmentId !== undefined) {
    const dept = await Department.findOne({ _id: departmentId, isDeleted: { $ne: true } });
    if (!dept) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    batch.departmentId = departmentId;
    batch.department = dept.name;
  }
  
  if (program !== undefined) {
    batch.program = program.trim();
  }
  
  if (programId !== undefined) {
    batch.programId = programId;
  }
  
  if (admissionSessionId !== undefined) {
    const session = await AcademicSession.findOne({ _id: admissionSessionId, isDeleted: { $ne: true } });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Admission session not found'
      });
    }
    batch.admissionSessionId = admissionSessionId;
    batch.admissionSession = session.name;
  }
  
  if (admissionSemester !== undefined) {
    batch.admissionSemester = admissionSemester;
  }
  
  if (expectedGraduation !== undefined) {
    batch.expectedGraduation = expectedGraduation;
  }
  
  if (status !== undefined && status !== '') {
    batch.status = status;
  }
  
  if (description !== undefined) {
    batch.description = description;
  }
  
  // Save the batch
  await batch.save();
  
  
  res.json({
    success: true,
    data: batch,
    message: 'Batch updated successfully'
  });
});

// DELETE /api/batches/:id - Delete batch
export const deleteBatch = handle(async (req, res) => {
  const { id } = req.params;
  
  
  const batch = await findBatchByIdentifier(id);
  if (!batch) {
    return res.status(404).json({
      success: false,
      message: 'Batch not found'
    });
  }
  
  await batch.deleteOne();
  
  
  res.json({
    success: true,
    message: 'Batch deleted successfully'
  });
});