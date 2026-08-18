// backend/src/controllers/batch.controller.js
import mongoose from 'mongoose';
import Batch from '../models/Batch.js';
import Department from '../models/Department.js';
import AcademicSession from '../models/AcademicSession.js';

// GET /api/batches - Get all batches
export async function getBatches(req, res, next) {
  try {
    const { department, program, status } = req.query;
    const filter = {};
    
    if (department) {
      filter.department = department;
    }
    
    if (program) {
      filter.program = program;
    }
    
    if (status) {
      filter.status = status;
    }
    
    const batches = await Batch.find(filter)
      .sort({ year: -1, program: 1 })
      .select('-__v');
    
    res.json({
      success: true,
      count: batches.length,
      data: batches
    });
  } catch (err) {
    console.error('Error fetching batches:', err);
    next(err);
  }
}

// Helper function to find batch by identifier
async function findBatchByIdentifier(identifier) {
  const query = [{ batchId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return Batch.findOne({ $or: query });
}

// GET /api/batches/:id - Get batch by ID
export async function getBatchById(req, res, next) {
  try {
    const batch = await findBatchByIdentifier(req.params.id);
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }
    
    res.json({ success: true, data: batch });
  } catch (err) {
    console.error('Error fetching batch:', err);
    next(err);
  }
}

// GET /api/batches/stats - Get batch statistics
export async function getBatchStats(req, res, next) {
  try {
    const total = await Batch.countDocuments();
    const active = await Batch.countDocuments({ status: 'Active' });
    const upcoming = await Batch.countDocuments({ status: 'Upcoming' });
    const completed = await Batch.countDocuments({ status: 'Completed' });
    const inactive = await Batch.countDocuments({ status: 'Inactive' });
    
    // Group by department
    const byDepartment = await Batch.aggregate([
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
  } catch (err) {
    console.error('Error fetching batch stats:', err);
    next(err);
  }
}

// POST /api/batches - Create new batch
export async function createBatch(req, res, next) {
  try {
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
    const dept = await Department.findById(departmentId);
    if (!dept) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    
    // Check if admission session exists
    const session = await AcademicSession.findById(admissionSessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Admission session not found'
      });
    }
    
    // Check for existing batch with same code
    const existing = await Batch.findOne({ code: code.toUpperCase().trim() });
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
  } catch (err) {
    console.error('❌ Error creating batch:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    next(err);
  }
}

// PUT /api/batches/:id - Update batch
export async function updateBatch(req, res, next) {
  try {
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
        _id: { $ne: batch._id } 
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
      const dept = await Department.findById(departmentId);
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
      const session = await AcademicSession.findById(admissionSessionId);
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
  } catch (err) {
    console.error('❌ Error updating batch:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    next(err);
  }
}

// DELETE /api/batches/:id - Delete batch
export async function deleteBatch(req, res, next) {
  try {
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
  } catch (err) {
    console.error('❌ Error deleting batch:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid batch ID format'
      });
    }
    next(err);
  }
}