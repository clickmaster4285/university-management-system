// backend/src/controllers/academicSession.controller.js
import mongoose from 'mongoose';
import AcademicSession from '../models/AcademicSession.js';

// GET /api/academic-sessions - Get all academic sessions
export async function getAcademicSessions(req, res, next) {
  try {
    const { status, isCurrent } = req.query;
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (isCurrent !== undefined) {
      filter.isCurrent = isCurrent === 'true';
    }
    
    const sessions = await AcademicSession.find(filter)
      .sort({ startDate: -1 })
      .select('-__v');
    
    res.json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (err) {
    console.error('Error fetching academic sessions:', err);
    next(err);
  }
}

// Helper function to find session by identifier
async function findSessionByIdentifier(identifier) {
  const query = [{ sessionId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return AcademicSession.findOne({ $or: query });
}

// GET /api/academic-sessions/:id - Get academic session by ID
export async function getAcademicSessionById(req, res, next) {
  try {
    const session = await findSessionByIdentifier(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Academic session not found'
      });
    }
    
    res.json({ success: true, data: session });
  } catch (err) {
    console.error('Error fetching academic session:', err);
    next(err);
  }
}

// GET /api/academic-sessions/current - Get current academic session
export async function getCurrentAcademicSession(req, res, next) {
  try {
    const session = await AcademicSession.findOne({ isCurrent: true });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No current academic session found'
      });
    }
    
    res.json({ success: true, data: session });
  } catch (err) {
    console.error('Error fetching current academic session:', err);
    next(err);
  }
}

// GET /api/academic-sessions/stats - Get academic session statistics
export async function getAcademicSessionStats(req, res, next) {
  try {
    const total = await AcademicSession.countDocuments();
    const active = await AcademicSession.countDocuments({ status: 'Active' });
    const upcoming = await AcademicSession.countDocuments({ status: 'Upcoming' });
    const completed = await AcademicSession.countDocuments({ status: 'Completed' });
    const inactive = await AcademicSession.countDocuments({ status: 'Inactive' });
    const currentSession = await AcademicSession.findOne({ isCurrent: true });
    
    res.json({
      success: true,
      data: {
        total,
        active,
        upcoming,
        completed,
        inactive,
        currentSession: currentSession || null
      }
    });
  } catch (err) {
    console.error('Error fetching academic session stats:', err);
    next(err);
  }
}

// POST /api/academic-sessions - Create new academic session
export async function createAcademicSession(req, res, next) {
  try {
    const { 
      name, 
      code, 
      startDate, 
      endDate, 
      status, 
      isCurrent, 
      description 
    } = req.body;
    
    // Validate required fields
    if (!name || !code || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Name, code, start date, and end date are required'
      });
    }
    
    // Check for existing session with same name or code
    const existing = await AcademicSession.findOne({ 
      $or: [{ name: name.trim() }, { code: code.toUpperCase().trim() }] 
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Academic session with this name or code already exists'
      });
    }
    
    // Create new session
    const session = new AcademicSession({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: status || 'Upcoming',
      isCurrent: isCurrent || false,
      description: description || ''
    });
    
    await session.save();
    
    res.status(201).json({
      success: true,
      data: session,
      message: 'Academic session created successfully'
    });
  } catch (err) {
    console.error('❌ Error creating academic session:', err);
    
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

// PUT /api/academic-sessions/:id - Update academic session
export async function updateAcademicSession(req, res, next) {
  try {
    const { id } = req.params;
    const { 
      name, 
      code, 
      startDate, 
      endDate, 
      status, 
      isCurrent, 
      description 
    } = req.body;
    
    // Find the session by Mongo _id or sessionId
    const session = await findSessionByIdentifier(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Academic session not found'
      });
    }
    
    // Update name if provided
    if (name !== undefined && name !== '') {
      const trimmedName = name.trim();
      const existing = await AcademicSession.findOne({ 
        name: trimmedName, 
        _id: { $ne: session._id } 
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Academic session name already exists'
        });
      }
      session.name = trimmedName;
    }
    
    // Update code if provided
    if (code !== undefined && code !== '') {
      const trimmedCode = code.toUpperCase().trim();
      const existing = await AcademicSession.findOne({ 
        code: trimmedCode, 
        _id: { $ne: session._id } 
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Academic session code already exists'
        });
      }
      session.code = trimmedCode;
    }
    
    // Update start date if provided
    if (startDate !== undefined) {
      session.startDate = new Date(startDate);
    }
    
    // Update end date if provided
    if (endDate !== undefined) {
      session.endDate = new Date(endDate);
    }
    
    // Update status if provided
    if (status !== undefined && status !== '') {
      session.status = status;
    }
    
    // Update isCurrent if provided
    if (isCurrent !== undefined) {
      session.isCurrent = isCurrent;
    }
    
    // Update description if provided
    if (description !== undefined) {
      session.description = description;
    }
    
    // Save the session
    await session.save();

    res.json({
      success: true,
      data: session,
      message: 'Academic session updated successfully'
    });
  } catch (err) {
    console.error('❌ Error updating academic session:', err);
    
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

// PATCH /api/academic-sessions/:id/set-current - Set a session as current
export async function setCurrentAcademicSession(req, res, next) {
  try {
    const { id } = req.params;

    // Find the session by Mongo _id or sessionId
    const session = await findSessionByIdentifier(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Academic session not found'
      });
    }
    
    // Set all sessions to not current
    await AcademicSession.updateMany(
      { _id: { $ne: session._id } },
      { $set: { isCurrent: false } }
    );
    
    // Set this session as current
    session.isCurrent = true;
    await session.save();

    res.json({
      success: true,
      data: session,
      message: `"${session.name}" is now the current academic session`
    });
  } catch (err) {
    console.error('❌ Error setting current academic session:', err);
    next(err);
  }
}

// DELETE /api/academic-sessions/:id - Delete academic session
export async function deleteAcademicSession(req, res, next) {
  try {
    const { id } = req.params;
    
    
    const session = await findSessionByIdentifier(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Academic session not found'
      });
    }
    
    // Check if session is current
    if (session.isCurrent) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the current academic session. Set another session as current first.'
      });
    }
    
    await session.deleteOne();
    
    
    res.json({
      success: true,
      message: 'Academic session deleted successfully'
    });
  } catch (err) {
    console.error('❌ Error deleting academic session:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format'
      });
    }
    next(err);
  }
}