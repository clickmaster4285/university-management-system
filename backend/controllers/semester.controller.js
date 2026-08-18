// backend/src/controllers/semester.controller.js
import mongoose from 'mongoose';
import Semester from '../models/Semester.js';
import AcademicSession from '../models/AcademicSession.js';

// GET /api/semesters - Get all semesters
export async function getSemesters(req, res, next) {
  try {
    const { academicSessionId, status } = req.query;
    const filter = {};
    
    if (academicSessionId) {
      filter.academicSessionId = academicSessionId;
    }
    
    if (status) {
      filter.status = status;
    }
    
    const semesters = await Semester.find(filter)
      .sort({ number: 1 })
      .select('-__v');
    
    res.json({
      success: true,
      count: semesters.length,
      data: semesters
    });
  } catch (err) {
    console.error('Error fetching semesters:', err);
    next(err);
  }
}

// Helper function to find semester by identifier
async function findSemesterByIdentifier(identifier) {
  const query = [{ semesterId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return Semester.findOne({ $or: query });
}

// GET /api/semesters/:id - Get semester by ID
export async function getSemesterById(req, res, next) {
  try {
    const semester = await findSemesterByIdentifier(req.params.id);
    
    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }
    
    res.json({ success: true, data: semester });
  } catch (err) {
    console.error('Error fetching semester:', err);
    next(err);
  }
}

// GET /api/semesters/session/:sessionId - Get semesters by session
export async function getSemestersBySession(req, res, next) {
  try {
    const { sessionId } = req.params;
    
    const semesters = await Semester.find({ academicSessionId: sessionId })
      .sort({ number: 1 })
      .select('-__v');
    
    res.json({
      success: true,
      count: semesters.length,
      data: semesters
    });
  } catch (err) {
    console.error('Error fetching semesters by session:', err);
    next(err);
  }
}

// GET /api/semesters/stats - Get semester statistics
export async function getSemesterStats(req, res, next) {
  try {
    const total = await Semester.countDocuments();
    const active = await Semester.countDocuments({ status: 'Active' });
    const upcoming = await Semester.countDocuments({ status: 'Upcoming' });
    const completed = await Semester.countDocuments({ status: 'Completed' });
    const inactive = await Semester.countDocuments({ status: 'Inactive' });
    
    // Group by session
    const bySession = await Semester.aggregate([
      {
        $group: {
          _id: '$academicSessionName',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          sessionName: '$_id',
          count: 1,
          _id: 0
        }
      },
      { $sort: { sessionName: 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        total,
        active,
        upcoming,
        completed,
        inactive,
        bySession
      }
    });
  } catch (err) {
    console.error('Error fetching semester stats:', err);
    next(err);
  }
}

// POST /api/semesters - Create new semester
export async function createSemester(req, res, next) {
  try {
    const { 
      academicSessionId,
      name,
      number,
      type,
      startDate,
      endDate,
      registrationStart,
      registrationEnd,
      status,
      description
    } = req.body;
    
    
    // Validate required fields
    if (!academicSessionId || !name || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Academic session, name, start date, and end date are required'
      });
    }
    
    // Check if academic session exists
    const session = await AcademicSession.findById(academicSessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Academic session not found'
      });
    }
    
    // Check for existing semester with same name in the same session
    const existing = await Semester.findOne({ 
      name: name.trim(),
      academicSessionId: academicSessionId
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Semester with this name already exists in this academic session'
      });
    }
    
    // Create new semester
    const semester = new Semester({
      academicSessionId,
      name: name.trim(),
      number: number || 1,
      type: type || 'Fall',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      registrationStart: registrationStart ? new Date(registrationStart) : null,
      registrationEnd: registrationEnd ? new Date(registrationEnd) : null,
      status: status || 'Upcoming',
      description: description || ''
    });
    
    await semester.save();
    
    
    res.status(201).json({
      success: true,
      data: semester,
      message: 'Semester created successfully'
    });
  } catch (err) {
    console.error('❌ Error creating semester:', err);
    
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

// PUT /api/semesters/:id - Update semester
export async function updateSemester(req, res, next) {
  try {
    const { id } = req.params;
    const { 
      academicSessionId,
      name,
      number,
      type,
      startDate,
      endDate,
      registrationStart,
      registrationEnd,
      status,
      description
    } = req.body;
    
    
    // Find the semester
    const semester = await findSemesterByIdentifier(id);
    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }
    
    // Update academic session if provided
    if (academicSessionId && academicSessionId !== semester.academicSessionId.toString()) {
      const session = await AcademicSession.findById(academicSessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Academic session not found'
        });
      }
      semester.academicSessionId = academicSessionId;
    }
    
    // Update name if provided
    if (name !== undefined && name !== '') {
      const trimmedName = name.trim();
      const existing = await Semester.findOne({ 
        name: trimmedName,
        academicSessionId: semester.academicSessionId,
        _id: { $ne: semester._id } 
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Semester with this name already exists in this academic session'
        });
      }
      semester.name = trimmedName;
    }
    
    // Update number if provided
    if (number !== undefined) {
      semester.number = number;
    }
    
    // Update type if provided
    if (type !== undefined && type !== '') {
      semester.type = type;
    }
    
    // Update dates if provided
    if (startDate !== undefined) {
      semester.startDate = new Date(startDate);
    }
    
    if (endDate !== undefined) {
      semester.endDate = new Date(endDate);
    }
    
    if (registrationStart !== undefined) {
      semester.registrationStart = registrationStart ? new Date(registrationStart) : null;
    }
    
    if (registrationEnd !== undefined) {
      semester.registrationEnd = registrationEnd ? new Date(registrationEnd) : null;
    }
    
    // Update status if provided
    if (status !== undefined && status !== '') {
      semester.status = status;
    }
    
    // Update description if provided
    if (description !== undefined) {
      semester.description = description;
    }
    
    // Save the semester
    await semester.save();
    
    
    res.json({
      success: true,
      data: semester,
      message: 'Semester updated successfully'
    });
  } catch (err) {
    console.error('❌ Error updating semester:', err);
    
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

// DELETE /api/semesters/:id - Delete semester
export async function deleteSemester(req, res, next) {
  try {
    const { id } = req.params;
    
    
    const semester = await findSemesterByIdentifier(id);
    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }
    
    await semester.deleteOne();
    
    
    res.json({
      success: true,
      message: 'Semester deleted successfully'
    });
  } catch (err) {
    console.error('❌ Error deleting semester:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid semester ID format'
      });
    }
    next(err);
  }
}