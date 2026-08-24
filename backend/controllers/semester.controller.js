// backend/src/controllers/semester.controller.js
import mongoose from 'mongoose';
import { handle } from "../utils/asyncHandler.js";

// GET /api/semesters - Get all semesters
import { AcademicSession, Semester } from '../models/index.js';
export const getSemesters = handle(async (req, res) => {
  const { academicSessionId, status } = req.query;
  const filter = { isDeleted: { $ne: true } };
  
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
});

// Helper function to find semester by identifier
async function findSemesterByIdentifier(identifier) {
  const query = [{ semesterId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return Semester.findOne({ $or: query, isDeleted: { $ne: true } });
}

// GET /api/semesters/:id - Get semester by ID
export const getSemesterById = handle(async (req, res) => {
  const semester = await findSemesterByIdentifier(req.params.id);
  
  if (!semester) {
    return res.status(404).json({
      success: false,
      message: 'Semester not found'
    });
  }
  
  res.json({ success: true, data: semester });
});

// GET /api/semesters/session/:sessionId - Get semesters by session
export const getSemestersBySession = handle(async (req, res) => {
  const { sessionId } = req.params;
  
  const semesters = await Semester.find({ academicSessionId: sessionId, isDeleted: { $ne: true } })
    .sort({ number: 1 })
    .select('-__v');
  
  res.json({
    success: true,
    count: semesters.length,
    data: semesters
  });
});

// GET /api/semesters/stats - Get semester statistics
export const getSemesterStats = handle(async (req, res) => {
  const total = await Semester.countDocuments({ isDeleted: { $ne: true } });
  const active = await Semester.countDocuments({ status: 'Active', isDeleted: { $ne: true } });
  const upcoming = await Semester.countDocuments({ status: 'Upcoming', isDeleted: { $ne: true } });
  const completed = await Semester.countDocuments({ status: 'Completed', isDeleted: { $ne: true } });
  const inactive = await Semester.countDocuments({ status: 'Inactive', isDeleted: { $ne: true } });
  
  const bySession = await Semester.aggregate([
    { $match: { isDeleted: { $ne: true } } },
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
});

// POST /api/semesters - Create new semester
export const createSemester = handle(async (req, res) => {
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
  
  if (!academicSessionId || !name || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Academic session, name, start date, and end date are required'
    });
  }
  
  const session = await AcademicSession.findOne({ _id: academicSessionId, isDeleted: { $ne: true } });
  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Academic session not found'
    });
  }
  
  const existing = await Semester.findOne({ 
    name: name.trim(),
    academicSessionId: academicSessionId,
    isDeleted: { $ne: true }
  });
  
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'Semester with this name already exists in this academic session'
    });
  }
  
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
});

// PUT /api/semesters/:id - Update semester
export const updateSemester = handle(async (req, res) => {
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
  
  const semester = await findSemesterByIdentifier(id);
  if (!semester) {
    return res.status(404).json({
      success: false,
      message: 'Semester not found'
    });
  }
  
  if (academicSessionId && academicSessionId !== semester.academicSessionId.toString()) {
    const session = await AcademicSession.findOne({ _id: academicSessionId, isDeleted: { $ne: true } });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Academic session not found'
      });
    }
    semester.academicSessionId = academicSessionId;
  }
  
  if (name !== undefined && name !== '') {
    const trimmedName = name.trim();
    const existing = await Semester.findOne({ 
      name: trimmedName,
      academicSessionId: semester.academicSessionId,
      _id: { $ne: semester._id },
      isDeleted: { $ne: true }
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Semester with this name already exists in this academic session'
      });
    }
    semester.name = trimmedName;
  }
  
  if (number !== undefined) {
    semester.number = number;
  }
  
  if (type !== undefined && type !== '') {
    semester.type = type;
  }
  
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
  
  if (status !== undefined && status !== '') {
    semester.status = status;
  }
  
  if (description !== undefined) {
    semester.description = description;
  }
  
  await semester.save();
  
  res.json({
    success: true,
    data: semester,
    message: 'Semester updated successfully'
  });
});

// DELETE /api/semesters/:id - Delete semester
export const deleteSemester = handle(async (req, res) => {
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
});
