import mongoose from 'mongoose';
import { handle } from "../utils/asyncHandler.js";

import { Assignment } from '../models/index.js';
import { resolveOfferingAcademicFields } from '../utils/resolveOfferingAcademicFields.js';

const normalizeUserRef = (value) => {
  if (!value) return undefined;
  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return undefined;
};

const OFFERING_DENORM_KEYS = [
  'offeringId',
  'subjectId',
  'programId',
  'batchId',
  'academicSessionId',
  'course',
  'courseCode',
  'department',
  'program',
  'semester',
  'academicYear',
  'instructor',
  'instructorEmail',
];

const applyOfferingFields = (target, resolved) => {
  if (!resolved) return;
  for (const key of OFFERING_DENORM_KEYS) {
    if (resolved[key] !== undefined && resolved[key] !== null && resolved[key] !== '') {
      target[key] = resolved[key];
    }
  }
};

// Get all assignments with filtering
export const getAllAssignments = handle(async (req, res) => {
  const { 
    course, 
    status, 
    instructor, 
    department,
    offeringId,
    subjectId,
    batchId,
    academicSessionId,
    programId,
    search,
    fromDate,
    toDate,
    limit = 50, 
    page = 1 
  } = req.query;
  
  const query = { isDeleted: { $ne: true } };
  if (course) query.course = { $regex: course, $options: 'i' };
  if (status) query.status = status;
  if (instructor) query.instructor = { $regex: instructor, $options: 'i' };
  if (department) query.department = department;
  if (offeringId && mongoose.Types.ObjectId.isValid(offeringId)) {
    query.offeringId = offeringId;
  }
  if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
    query.subjectId = subjectId;
  }
  if (batchId && mongoose.Types.ObjectId.isValid(batchId)) {
    query.batchId = batchId;
  }
  if (academicSessionId && mongoose.Types.ObjectId.isValid(academicSessionId)) {
    query.academicSessionId = academicSessionId;
  }
  if (programId && mongoose.Types.ObjectId.isValid(programId)) {
    query.programId = programId;
  }
  if (fromDate || toDate) {
    query.dueDate = {};
    if (fromDate) query.dueDate.$gte = new Date(fromDate);
    if (toDate) query.dueDate.$lte = new Date(toDate);
  }
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { course: { $regex: search, $options: 'i' } },
      { courseCode: { $regex: search, $options: 'i' } },
      { instructor: { $regex: search, $options: 'i' } },
      { assignmentId: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [assignments, total] = await Promise.all([
    Assignment.find(query)
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Assignment.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: assignments || [],
    pagination: {
      total: total || 0,
      page: parseInt(page) || 1,
      pages: Math.ceil((total || 0) / parseInt(limit)) || 0,
      limit: parseInt(limit) || 50
    }
  });
});

// Get single assignment by ID
export const getAssignmentById = handle(async (req, res) => {
  const assignment = await Assignment.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  
  if (!assignment) {
    return res.status(404).json({ 
      success: false, 
      message: 'Assignment not found',
      data: null
    });
  }
  
  res.json({ 
    success: true, 
    data: assignment 
  });
});

// Create new assignment
export const createAssignment = handle(async (req, res) => {
  const offeringId = req.body.offeringId;
  if (!offeringId) {
    return res.status(400).json({
      success: false,
      message: 'offeringId is required',
      data: null
    });
  }

  const resolved = await resolveOfferingAcademicFields(offeringId);
  if (!resolved) {
    return res.status(400).json({
      success: false,
      message: 'Course offering not found',
      data: null
    });
  }

  const requiredFields = ['title', 'description', 'dueDate', 'submissionDeadline'];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(', ')}`,
      data: null
    });
  }

  const payload = { ...req.body };
  applyOfferingFields(payload, resolved);
  if (!payload.instructor) {
    payload.instructor = req.body.instructor || 'Unassigned';
  }
  if (!payload.department) {
    payload.department = req.body.department || 'N/A';
  }
  if (!payload.program) {
    payload.program = req.body.program || 'N/A';
  }
  if (!payload.academicYear) {
    payload.academicYear = req.body.academicYear || new Date().getFullYear().toString();
  }

  const assignment = new Assignment({
    ...payload,
    createdBy: normalizeUserRef(req.user?.id)
  });
  
  await assignment.save();
  
  
  res.status(201).json({ 
    success: true, 
    data: assignment,
    message: `Assignment created successfully. ID: ${assignment.assignmentId}`
  });
});

// Update assignment - FIXED
export const updateAssignment = handle(async (req, res) => {
  const assignment = await Assignment.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!assignment) {
    return res.status(404).json({ 
      success: false, 
      message: 'Assignment not found',
      data: null
    });
  }

  if (req.body.offeringId) {
    const resolved = await resolveOfferingAcademicFields(req.body.offeringId);
    if (!resolved) {
      return res.status(400).json({
        success: false,
        message: 'Course offering not found',
        data: null
      });
    }
    applyOfferingFields(assignment, resolved);
  }

  // Update fields - FIXED for date handling
  const updateableFields = [
    'title', 'description', 'course', 'courseCode', 'department', 'program',
    'semester', 'academicYear', 'instructor', 'instructorEmail', 'type',
    'maxScore', 'passingScore', 'weightage', 'dueDate', 'submissionDeadline',
    'lateSubmissionDeadline', 'allowLateSubmissions', 'lateSubmissionPenalty',
    'maxAttempts', 'submissionType', 'allowedFileTypes', 'maxFileSize',
    'status', 'isActive', 'isGraded', 'showGrades', 'instructions',
    'gradingCriteria', 'rubric'
  ];
  
  updateableFields.forEach(field => {
    if (req.body[field] !== undefined) {
      const value = req.body[field];
      
      // Handle numeric fields
      if (field === 'maxScore' || field === 'passingScore' || field === 'weightage' || 
          field === 'lateSubmissionPenalty' || field === 'maxAttempts' || field === 'maxFileSize') {
        assignment[field] = parseFloat(value) || 0;
      } 
      // Handle semester
      else if (field === 'semester') {
        assignment[field] = parseInt(value) || 1;
      } 
      // Handle date fields - FIXED: properly handle empty strings
      else if (field === 'dueDate' || field === 'submissionDeadline' || field === 'lateSubmissionDeadline') {
        if (value === '' || value === null || value === undefined) {
          // If value is empty, keep the existing value
          // Don't set to undefined, just skip
        } else {
          const parsedDate = new Date(value);
          if (!isNaN(parsedDate.getTime())) {
            assignment[field] = parsedDate;
          }
        }
      }
      // Handle optional string fields to avoid validation failures on empty values
      else if (field === 'instructorEmail' || field === 'instructions' || field === 'gradingCriteria') {
        if (value === '' || value === null || value === undefined) {
          assignment[field] = undefined;
        } else {
          assignment[field] = String(value).trim();
        }
      }
      // Handle boolean fields
      else if (field === 'allowLateSubmissions' || field === 'isActive' || field === 'isGraded' || field === 'showGrades') {
        assignment[field] = value === true || value === 'true';
      }
      // Handle array fields
      else if (field === 'allowedFileTypes' || field === 'rubric') {
        if (Array.isArray(value)) {
          if (field === 'rubric') {
            assignment[field] = value.filter((item) => {
              if (!item || typeof item !== 'object') return false;
              return !!(item.criterion?.toString().trim() || item.description?.toString().trim() || Number(item.maxPoints) > 0);
            });
          } else {
            assignment[field] = value;
          }
        }
      }
      // Handle all other fields
      else {
        assignment[field] = value;
      }
    }
  });

  assignment.updatedBy = normalizeUserRef(req.user?.id);
  await assignment.save();
  
  
  res.json({ 
    success: true, 
    data: assignment,
    message: 'Assignment updated successfully'
  });
});

// Delete assignment
export const deleteAssignment = handle(async (req, res) => {
  const assignment = await Assignment.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!assignment) {
    return res.status(404).json({ 
      success: false, 
      message: 'Assignment not found'
    });
  }

  await assignment.deleteOne();
  
  res.json({ 
    success: true, 
    message: 'Assignment deleted successfully' 
  });
});

// Get assignment statistics
export const getAssignmentStats = handle(async (req, res) => {
  const total = await Assignment.countDocuments({ isDeleted: { $ne: true } }) || 0;
  const open = await Assignment.countDocuments({ status: 'Open', isDeleted: { $ne: true } }) || 0;
  const grading = await Assignment.countDocuments({ status: 'Grading', isDeleted: { $ne: true } }) || 0;
  const graded = await Assignment.countDocuments({ status: 'Graded', isDeleted: { $ne: true } }) || 0;
  const draft = await Assignment.countDocuments({ status: 'Draft', isDeleted: { $ne: true } }) || 0;
  const closed = await Assignment.countDocuments({ status: 'Closed', isDeleted: { $ne: true } }) || 0;

  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const upcomingDeadlines = await Assignment.find({
    dueDate: { $gte: now, $lte: nextWeek },
    status: { $in: ['Open', 'Published'] },
    isDeleted: { $ne: true }
  }).sort({ dueDate: 1 });

  res.json({
    success: true,
    data: {
      total,
      open,
      grading,
      graded,
      draft,
      closed,
      upcomingDeadlines: upcomingDeadlines.map(a => ({
        id: a._id,
        title: a.title,
        course: a.course,
        dueDate: a.dueDate,
        daysLeft: Math.ceil((a.dueDate - now) / (1000 * 60 * 60 * 24))
      }))
    }
  });
});

// Get assignments by course
export const getAssignmentsByCourse = handle(async (req, res) => {
  const { courseCode } = req.params;
  const assignments = await Assignment.find({ courseCode, isDeleted: { $ne: true } })
    .sort({ dueDate: 1 });
  
  res.json({
    success: true,
    data: assignments || [],
    count: assignments.length || 0
  });
});