import mongoose from 'mongoose';
import Assignment from '../models/academic/Assignment.js';

const normalizeUserRef = (value) => {
  if (!value) return undefined;
  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return undefined;
};

// Get all assignments with filtering
export const getAllAssignments = async (req, res) => {
  try {
    const { 
      course, 
      status, 
      instructor, 
      department,
      search,
      fromDate,
      toDate,
      limit = 50, 
      page = 1 
    } = req.query;
    
    const query = {};
    if (course) query.course = { $regex: course, $options: 'i' };
    if (status) query.status = status;
    if (instructor) query.instructor = { $regex: instructor, $options: 'i' };
    if (department) query.department = department;
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
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.json({
      success: false,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        pages: 0,
        limit: 50
      },
      message: error.message || 'Failed to fetch assignments'
    });
  }
};

// Get single assignment by ID
export const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
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
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch assignment',
      error: error.message,
      data: null
    });
  }
};

// Create new assignment
export const createAssignment = async (req, res) => {
  try {
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'course', 'courseCode', 'department', 'program', 'semester', 'instructor', 'dueDate', 'submissionDeadline'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        data: null
      });
    }

    const assignment = new Assignment({
      ...req.body,
      createdBy: normalizeUserRef(req.user?.id)
    });
    
    await assignment.save();
    
    
    res.status(201).json({ 
      success: true, 
      data: assignment,
      message: `Assignment created successfully. ID: ${assignment.assignmentId}`
    });
  } catch (error) {
    console.error('❌ Error creating assignment:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors,
        data: null
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create assignment',
      error: error.message,
      data: null
    });
  }
};

// Update assignment - FIXED
export const updateAssignment = async (req, res) => {
  try {
    
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment not found',
        data: null
      });
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
  } catch (error) {
    console.error('❌ Error updating assignment:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors,
        data: null
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update assignment',
      error: error.message,
      data: null
    });
  }
};

// Delete assignment
export const deleteAssignment = async (req, res) => {
  try {
    
    const assignment = await Assignment.findById(req.params.id);
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
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete assignment',
      error: error.message
    });
  }
};

// Get assignment statistics
export const getAssignmentStats = async (req, res) => {
  try {
    const total = await Assignment.countDocuments() || 0;
    const open = await Assignment.countDocuments({ status: 'Open' }) || 0;
    const grading = await Assignment.countDocuments({ status: 'Grading' }) || 0;
    const graded = await Assignment.countDocuments({ status: 'Graded' }) || 0;
    const draft = await Assignment.countDocuments({ status: 'Draft' }) || 0;
    const closed = await Assignment.countDocuments({ status: 'Closed' }) || 0;

    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingDeadlines = await Assignment.find({
      dueDate: { $gte: now, $lte: nextWeek },
      status: { $in: ['Open', 'Published'] }
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
  } catch (error) {
    console.error('Error fetching assignment stats:', error);
    res.json({
      success: false,
      data: {
        total: 0,
        open: 0,
        grading: 0,
        graded: 0,
        draft: 0,
        closed: 0,
        upcomingDeadlines: []
      },
      message: error.message || 'Failed to fetch statistics'
    });
  }
};

// Get assignments by course
export const getAssignmentsByCourse = async (req, res) => {
  try {
    const { courseCode } = req.params;
    const assignments = await Assignment.find({ courseCode })
      .sort({ dueDate: 1 });
    
    res.json({
      success: true,
      data: assignments || [],
      count: assignments.length || 0
    });
  } catch (error) {
    console.error('Error fetching assignments by course:', error);
    res.json({
      success: false,
      data: [],
      count: 0,
      message: error.message || 'Failed to fetch assignments'
    });
  }
};