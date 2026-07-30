import Course from '../models/Course.js';
import Department from '../models/Department.js';

// GET /api/courses - Get all courses with filters
export async function getCourses(req, res, next) {
  try {
    const { 
      department, 
      status, 
      semester, 
      search, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    const filter = {};
    if (department) filter.departmentName = department;
    if (status) filter.status = status;
    if (semester) filter.semester = semester;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } },
        { departmentName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const courses = await Course.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ code: 1 })
      .select('-__v');

    const totalCount = await Course.countDocuments(filter);

    res.json({
      success: true,
      count: courses.length,
      total: totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      data: courses
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/courses/:id - Get course by ID
export async function getCourseById(req, res, next) {
  try {
    const course = await Course.findOne({ courseId: req.params.id })
      .select('-__v');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: `Course ${req.params.id} not found`
      });
    }
    
    res.json({ success: true, data: course });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID format'
      });
    }
    next(err);
  }
}

// POST /api/courses - Create new course
export async function createCourse(req, res, next) {
  try {
    const { code, name, department, credits } = req.body;
    
    if (!code || !name || !department || !credits) {
      return res.status(400).json({
        success: false,
        message: "Code, name, department and credits are required fields"
      });
    }

    const existingCode = await Course.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: `Course with code ${code} already exists`
      });
    }

    const deptExists = await Department.findOne({ name: department });
    if (!deptExists) {
      return res.status(400).json({
        success: false,
        message: `Department '${department}' not found. Please create the department first.`
      });
    }

    const courseData = {
      ...req.body,
      departmentName: department,
      code: code.toUpperCase()
    };
    
    const course = new Course(courseData);
    await course.save();

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate ${field}. Please use a unique value.`
      });
    }
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    next(err);
  }
}

// PUT /api/courses/:id - Update course
export async function updateCourse(req, res, next) {
  try {
    const { id } = req.params;
    
    const existing = await Course.findOne({ courseId: id });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Course ${id} not found`
      });
    }

    if (req.body.code) {
      const duplicate = await Course.findOne({
        code: req.body.code.toUpperCase(),
        courseId: { $ne: id }
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Course with code ${req.body.code} already exists`
        });
      }
    }

    if (req.body.department) {
      const deptExists = await Department.findOne({ name: req.body.department });
      if (!deptExists) {
        return res.status(400).json({
          success: false,
          message: `Department '${req.body.department}' not found`
        });
      }
      req.body.departmentName = req.body.department;
    }

    const { courseId, ...updateData } = req.body;
    
    const course = await Course.findOneAndUpdate(
      { courseId: id },
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    res.json({
      success: true,
      data: course
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    next(err);
  }
}

// DELETE /api/courses/:id - Delete course
export async function deleteCourse(req, res, next) {
  try {
    const { id } = req.params;
    const course = await Course.findOneAndDelete({ courseId: id });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: `Course ${id} not found`
      });
    }

    res.json({
      success: true,
      message: "Course deleted successfully",
      data: course
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID format'
      });
    }
    next(err);
  }
}

// GET /api/courses/stats - Get course statistics
export async function getCourseStats(req, res, next) {
  try {
    const stats = await Course.aggregate([
      {
        $group: {
          _id: null,
          totalCourses: { $sum: 1 },
          avgCredits: { $avg: '$credits' },
          totalCapacity: { $sum: '$capacity' },
          totalEnrolled: { $sum: '$enrolledStudents' },
          avgEnrollment: { $avg: '$enrolledStudents' }
        }
      }
    ]);

    const active = await Course.countDocuments({ status: 'Active' });
    const inactive = await Course.countDocuments({ status: 'Inactive' });
    const completed = await Course.countDocuments({ status: 'Completed' });
    const cancelled = await Course.countDocuments({ status: 'Cancelled' });

    const deptStats = await Course.aggregate([
      {
        $group: {
          _id: '$departmentName',
          count: { $sum: 1 },
          totalEnrolled: { $sum: '$enrolledStudents' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const semesterStats = await Course.aggregate([
      {
        $group: {
          _id: '$semester',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overall: stats[0] || {
          totalCourses: 0,
          avgCredits: 0,
          totalCapacity: 0,
          totalEnrolled: 0,
          avgEnrollment: 0
        },
        byStatus: {
          active,
          inactive,
          completed,
          cancelled
        },
        byDepartment: deptStats,
        bySemester: semesterStats
      }
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/courses/bulk - Bulk create courses
export async function bulkCreateCourses(req, res, next) {
  try {
    const courses = req.body.courses || req.body;
    
    if (!Array.isArray(courses)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of courses'
      });
    }

    if (courses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Courses array cannot be empty'
      });
    }

    const invalidCourses = courses.filter(c => !c.code || !c.name || !c.department || !c.credits);
    if (invalidCourses.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Each course must have code, name, department and credits',
        invalidCount: invalidCourses.length
      });
    }

    const codes = courses.map(c => c.code.toUpperCase());
    const existingCodes = await Course.find({ code: { $in: codes } });
    if (existingCodes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate course codes found',
        duplicates: existingCodes.map(c => c.code)
      });
    }

    const departments = [...new Set(courses.map(c => c.department))];
    const existingDepts = await Department.find({ name: { $in: departments } });
    const existingDeptNames = existingDepts.map(d => d.name);
    const missingDepts = departments.filter(d => !existingDeptNames.includes(d));
    
    if (missingDepts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some departments do not exist',
        missingDepartments: missingDepts
      });
    }

    const coursesWithDept = courses.map(c => ({
      ...c,
      departmentName: c.department,
      code: c.code.toUpperCase()
    }));

    const createdCourses = await Course.insertMany(coursesWithDept);
    
    res.status(201).json({
      success: true,
      count: createdCourses.length,
      data: createdCourses
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate key error. Check for duplicate course codes.',
        error: err.message
      });
    }
    next(err);
  }
}