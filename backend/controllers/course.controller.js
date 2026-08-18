// backend/src/controllers/course.controller.js
import Course from '../models/Course.js';
import Department from '../models/Department.js';
import mongoose from 'mongoose';

// ==================== GET COURSES ====================

// GET /api/courses - Get all courses with filters
export async function getCourses(req, res, next) {
  try {
    const { 
      department, 
      program,
      status, 
      semester, 
      semesterType,
      year,
      search, 
      page = 1, 
      limit = 10,
      isActive,
      feeApplied
    } = req.query;
    
    const filter = {};
    if (department) filter.departmentName = department;
    if (program) filter.program = program;
    if (status) filter.status = status;
    if (semester) filter.semester = parseInt(semester);
    if (semesterType) filter.semesterType = semesterType;
    if (year) filter.year = parseInt(year);
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (feeApplied !== undefined) filter.isFeeApplied = feeApplied === 'true';
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } },
        { departmentName: { $regex: search, $options: 'i' } },
        { courseId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const courses = await Course.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ code: 1 })
      .populate('instructorId', 'name email')
      .populate('prerequisitesCourses', 'code name')
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

// GET /api/courses/active - Get active courses only
export async function getActiveCourses(req, res, next) {
  try {
    const { department, program, semester } = req.query;
    
    const filter = { isActive: true, status: 'Active' };
    if (department) filter.departmentName = department;
    if (program) filter.program = program;
    if (semester) filter.semester = parseInt(semester);
    
    const courses = await Course.find(filter)
      .sort({ code: 1 })
      .select('code name credits feePerCredit totalFee departmentName program semester instructor capacity enrolledStudents');
    
    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/courses/with-fee - Get courses with fee structure
export async function getCoursesWithFee(req, res, next) {
  try {
    const { department, program, semester } = req.query;
    
    const filter = { isActive: true, isFeeApplied: true };
    if (department) filter.departmentName = department;
    if (program) filter.program = program;
    if (semester) filter.semester = parseInt(semester);
    
    const courses = await Course.find(filter)
      .sort({ code: 1 })
      .select('code name credits feePerCredit totalFee feeType departmentName program semester');
    
    res.json({
      success: true,
      count: courses.length,
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
      .populate('instructorId', 'name email')
      .populate('prerequisitesCourses', 'code name')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
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

// GET /api/courses/code/:code - Get course by code
export async function getCourseByCode(req, res, next) {
  try {
    const { code } = req.params;
    
    const course = await Course.findOne({ 
      code: code.toUpperCase(),
      isActive: true 
    })
    .populate('instructorId', 'name email')
    .populate('prerequisitesCourses', 'code name');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: `Course ${code} not found`
      });
    }
    
    res.json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
}

// GET /api/courses/department/:department - Get courses by department
export async function getCoursesByDepartment(req, res, next) {
  try {
    const { department } = req.params;
    const { isActive = true } = req.query;
    
    const courses = await Course.find({ 
      departmentName: department,
      isActive: isActive === 'true'
    })
    .sort({ code: 1 })
    .select('code name credits feePerCredit totalFee semester program');
    
    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/courses/program/:program - Get courses by program
export async function getCoursesByProgram(req, res, next) {
  try {
    const { program } = req.params;
    const { semester, isActive = true } = req.query;
    
    const filter = { program, isActive: isActive === 'true' };
    if (semester) filter.semester = parseInt(semester);
    
    const courses = await Course.find(filter)
      .sort({ semester: 1, code: 1 })
      .select('code name credits feePerCredit totalFee semester departmentName');
    
    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/courses/semester/:semester - Get courses by semester
export async function getCoursesBySemester(req, res, next) {
  try {
    const { semester } = req.params;
    const { program, department, isActive = true } = req.query;
    
    const filter = { semester: parseInt(semester), isActive: isActive === 'true' };
    if (program) filter.program = program;
    if (department) filter.departmentName = department;
    
    const courses = await Course.find(filter)
      .sort({ code: 1 })
      .select('code name credits feePerCredit totalFee program departmentName');
    
    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/courses/instructor/:instructorId - Get courses by instructor
export async function getCoursesByInstructor(req, res, next) {
  try {
    const { instructorId } = req.params;
    const { semester, isActive = true } = req.query;
    
    const filter = { 
      instructorId,
      isActive: isActive === 'true'
    };
    if (semester) filter.semester = parseInt(semester);
    
    const courses = await Course.find(filter)
      .sort({ semester: 1, code: 1 })
      .populate('instructorId', 'name email');
    
    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/courses/program/:program/fee-structure - Get program fee structure
export async function getProgramFeeStructure(req, res, next) {
  try {
    const { program } = req.params;
    
    const result = await Course.aggregate([
      { 
        $match: { 
          program, 
          isActive: true, 
          isFeeApplied: true 
        } 
      },
      { 
        $group: {
          _id: {
            semester: '$semester',
            department: '$departmentName'
          },
          courses: { 
            $push: {
              code: '$code',
              name: '$name',
              credits: '$credits',
              feePerCredit: '$feePerCredit',
              totalFee: '$totalFee'
            }
          },
          semesterTotal: { $sum: '$totalFee' },
          totalCredits: { $sum: '$credits' },
          courseCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.semester': 1 } },
      { 
        $group: {
          _id: '$_id.department',
          semesters: {
            $push: {
              semester: '$_id.semester',
              totalFee: '$semesterTotal',
              totalCredits: '$totalCredits',
              courseCount: '$courseCount',
              courses: '$courses'
            }
          },
          departmentTotal: { $sum: '$semesterTotal' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/courses/fee-summary - Get course fee summary
export async function getCourseFeeSummary(req, res, next) {
  try {
    const { department, program } = req.query;
    
    const filter = { isActive: true, isFeeApplied: true };
    if (department) filter.departmentName = department;
    if (program) filter.program = program;
    
    const summary = await Course.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            department: '$departmentName',
            program: '$program',
            semester: '$semester'
          },
          totalCourses: { $sum: 1 },
          totalCredits: { $sum: '$credits' },
          totalFee: { $sum: '$totalFee' },
          avgFeePerCredit: { $avg: '$feePerCredit' },
          minFee: { $min: '$totalFee' },
          maxFee: { $max: '$totalFee' }
        }
      },
      {
        $group: {
          _id: '$_id.department',
          programs: {
            $push: {
              program: '$_id.program',
              semester: '$_id.semester',
              totalCourses: '$totalCourses',
              totalCredits: '$totalCredits',
              totalFee: '$totalFee',
              avgFeePerCredit: '$avgFeePerCredit',
              minFee: '$minFee',
              maxFee: '$maxFee'
            }
          },
          departmentTotal: { $sum: '$totalFee' },
          departmentCourses: { $sum: '$totalCourses' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/courses/enrollment-stats - Get course enrollment statistics
export async function getCourseEnrollmentStats(req, res, next) {
  try {
    const { department, program } = req.query;
    
    const filter = { isActive: true };
    if (department) filter.departmentName = department;
    if (program) filter.program = program;
    
    const stats = await Course.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalEnrolled: { $sum: '$enrolledStudents' },
          totalCapacity: { $sum: '$capacity' },
          totalWaitlist: { $sum: '$waitlistCount' },
          avgEnrollment: { $avg: '$enrolledStudents' },
          fullCourses: {
            $sum: { $cond: [{ $eq: ['$enrolledStudents', '$capacity'] }, 1, 0] }
          },
          availableCourses: {
            $sum: { $cond: [{ $lt: ['$enrolledStudents', '$capacity'] }, 1, 0] }
          }
        }
      }
    ]);
    
    // Get top enrolled courses
    const topCourses = await Course.find(filter)
      .sort({ enrolledStudents: -1 })
      .limit(10)
      .select('code name enrolledStudents capacity departmentName program');
    
    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalEnrolled: 0,
          totalCapacity: 0,
          totalWaitlist: 0,
          avgEnrollment: 0,
          fullCourses: 0,
          availableCourses: 0
        },
        topCourses
      }
    });
  } catch (err) {
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
          avgEnrollment: { $avg: '$enrolledStudents' },
          totalFee: { $sum: '$totalFee' },
          avgFee: { $avg: '$totalFee' }
        }
      }
    ]);

    const active = await Course.countDocuments({ status: 'Active' });
    const inactive = await Course.countDocuments({ status: 'Inactive' });
    const completed = await Course.countDocuments({ status: 'Completed' });
    const cancelled = await Course.countDocuments({ status: 'Cancelled' });
    const draft = await Course.countDocuments({ status: 'Draft' });

    const deptStats = await Course.aggregate([
      {
        $group: {
          _id: '$departmentName',
          count: { $sum: 1 },
          totalEnrolled: { $sum: '$enrolledStudents' },
          totalFee: { $sum: '$totalFee' }
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
      { $sort: { _id: 1 } }
    ]);

    const programStats = await Course.aggregate([
      {
        $group: {
          _id: '$program',
          count: { $sum: 1 },
          totalEnrolled: { $sum: '$enrolledStudents' }
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
          avgEnrollment: 0,
          totalFee: 0,
          avgFee: 0
        },
        byStatus: {
          active,
          inactive,
          completed,
          cancelled,
          draft
        },
        byDepartment: deptStats,
        bySemester: semesterStats,
        byProgram: programStats
      }
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/courses/:id/fee-breakdown - Get course fee breakdown
export async function getCourseFeeBreakdown(req, res, next) {
  try {
    const { id } = req.params;
    
    const course = await Course.findOne({ courseId: id })
      .select('code name credits feePerCredit totalFee feeType isFeeApplied');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    const breakdown = {
      courseCode: course.code,
      courseName: course.name,
      credits: course.credits,
      feePerCredit: course.feePerCredit,
      totalFee: course.totalFee,
      feeType: course.feeType,
      isFeeApplied: course.isFeeApplied,
      breakdown: [
        {
          description: `${course.code} - ${course.credits} credits × PKR ${course.feePerCredit.toLocaleString()}`,
          amount: course.totalFee
        }
      ]
    };
    
    res.json({
      success: true,
      data: breakdown
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/courses/:id/schedule - Get course schedule
export async function getCourseSchedule(req, res, next) {
  try {
    const { id } = req.params;
    
    const course = await Course.findOne({ courseId: id }).select('schedule code name');
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    res.json({
      success: true,
      data: course.schedule || null
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/courses/:id/enrollments - Get course enrollments
export async function getCourseEnrollments(req, res, next) {
  try {
    const { id } = req.params;
    
    const course = await Course.findOne({ courseId: id })
      .populate('instructorId', 'name email')
      .select('code name enrolledStudents capacity waitlistCount');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        course: {
          code: course.code,
          name: course.name,
          enrolledStudents: course.enrolledStudents,
          capacity: course.capacity,
          waitlistCount: course.waitlistCount,
          availableSeats: course.capacity - course.enrolledStudents,
          isFull: course.enrolledStudents >= course.capacity
        },
        students: [] // Would fetch from enrollment model
      }
    });
  } catch (err) {
    next(err);
  }
}

// ==================== CREATE COURSES ====================

// POST /api/courses - Create new course
export async function createCourse(req, res, next) {
  try {
    const { 
      code, 
      name, 
      department, 
      credits, 
      program, 
      semester,
      semesterType,
      year,
      feePerCredit, 
      feeType, 
      isFeeApplied,
      instructor, 
      instructorId, 
      capacity,
      enrolledStudents,
      description,
      status,
      prerequisites,
      tags,
      learningOutcomes,
      textbooks,
      schedule
    } = req.body;

    
    // Validate required fields with proper checks
    const requiredFields = ['code', 'name', 'department', 'credits', 'program', 'semester'];
    const missingFields = requiredFields.filter(function(field) {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: ' + missingFields.join(', '),
        errors: missingFields
      });
    }

    // Normalize inputs
    const normalizedCode = String(code).toUpperCase().trim();
    const normalizedName = String(name).trim();
    const normalizedDepartment = String(department).trim();
    const normalizedProgram = String(program).toUpperCase().trim();
    const parsedCredits = Number(credits) || 3;
    const parsedSemester = Number(semester) || 1;
    const parsedFeePerCredit = Number(feePerCredit) || 0;
    const parsedCapacity = Number(capacity) || 30;
    const parsedEnrolled = Number(enrolledStudents) || 0;
    const parsedYear = Number(year) || new Date().getFullYear();

    // Check if course code already exists
    const existingCode = await Course.findOne({ code: normalizedCode });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Course with code ' + normalizedCode + ' already exists'
      });
    }

    // Check if department exists
    const deptExists = await Department.findOne({ name: normalizedDepartment });
    if (!deptExists) {
      return res.status(400).json({
        success: false,
        message: 'Department \'' + normalizedDepartment + '\' not found. Please create the department first.'
      });
    }

    // Prepare course data with defaults
    const courseData = {
      code: normalizedCode,
      name: normalizedName,
      department: normalizedDepartment,
      departmentName: normalizedDepartment,
      program: normalizedProgram,
      semester: parsedSemester,
      semesterType: semesterType || 'Fall',
      year: parsedYear,
      credits: parsedCredits,
      feePerCredit: parsedFeePerCredit,
      feeType: feeType || 'Tuition',
      isFeeApplied: isFeeApplied !== undefined ? isFeeApplied : true,
      instructor: instructor || '',
      instructorId: instructorId || null,
      capacity: parsedCapacity,
      enrolledStudents: parsedEnrolled,
      waitlistCount: 0,
      status: status || 'Active',
      isActive: true,
      description: description || '',
      prerequisites: prerequisites || [],
      tags: tags || [],
      learningOutcomes: learningOutcomes || [],
      textbooks: textbooks || [],
      ...(() => {
        if (!schedule || typeof schedule !== 'object') return {};
        const trimmedSchedule = {};
        if (schedule.day) trimmedSchedule.day = String(schedule.day).trim();
        if (schedule.startTime) trimmedSchedule.startTime = String(schedule.startTime).trim();
        if (schedule.endTime) trimmedSchedule.endTime = String(schedule.endTime).trim();
        if (schedule.room) trimmedSchedule.room = String(schedule.room).trim();
        if (schedule.building) trimmedSchedule.building = String(schedule.building).trim();
        return Object.keys(trimmedSchedule).length > 0 ? { schedule: trimmedSchedule } : {};
      })(),
      createdBy: (req.user && req.user.id) || null,
      lastUpdatedAt: new Date(),
      totalFee: parsedCredits * parsedFeePerCredit
    };


    const course = new Course(courseData);
    await course.save();

    res.status(201).json({
      success: true,
      data: course,
      message: 'Course created successfully'
    });
  } catch (err) {
    console.error('❌ Error creating course:', err);
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: 'Duplicate ' + field + '. Please use a unique value.'
      });
    }
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(function(e) {
        return e.message;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    next(err);
  }
}

// POST /api/courses/bulk - Bulk create courses
export async function createBulkCourses(req, res, next) {
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

    const invalidCourses = courses.filter(function(c) {
      return !c.code || !c.name || !c.department || !c.credits || !c.program || !c.semester;
    });
    if (invalidCourses.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Each course must have code, name, department, credits, program and semester',
        invalidCount: invalidCourses.length
      });
    }

    const codes = courses.map(function(c) { return c.code.toUpperCase(); });
    const existingCodes = await Course.find({ code: { $in: codes } });
    if (existingCodes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate course codes found',
        duplicates: existingCodes.map(function(c) { return c.code; })
      });
    }

    const departments = [...new Set(courses.map(function(c) { return c.department; }))];
    const existingDepts = await Department.find({ name: { $in: departments } });
    const existingDeptNames = existingDepts.map(function(d) { return d.name; });
    const missingDepts = departments.filter(function(d) {
      return !existingDeptNames.includes(d);
    });
    
    if (missingDepts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some departments do not exist',
        missingDepartments: missingDepts
      });
    }

    const coursesWithDept = courses.map(function(c) {
      return {
        ...c,
        departmentName: c.department,
        code: c.code.toUpperCase(),
        totalFee: c.credits * (c.feePerCredit || 0),
        createdBy: (req.user && req.user.id) || null,
        lastUpdatedAt: new Date()
      };
    });

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

// POST /api/courses/bulk/fee - Bulk update course fees
export async function bulkUpdateCourseFees(req, res, next) {
  try {
    const { courses } = req.body;
    
    if (!courses || !Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of course fee updates'
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const updateData of courses) {
      try {
        const { courseId, feePerCredit, isFeeApplied, feeType } = updateData;
        
        const course = await Course.findOne({ courseId });
        if (!course) {
          errors.push({ courseId: courseId, error: 'Course not found' });
          continue;
        }
        
        if (feePerCredit !== undefined) {
          course.feePerCredit = feePerCredit;
          course.totalFee = course.credits * feePerCredit;
        }
        if (isFeeApplied !== undefined) course.isFeeApplied = isFeeApplied;
        if (feeType !== undefined) course.feeType = feeType;
        
        course.updatedBy = (req.user && req.user.id) || null;
        course.lastUpdatedAt = new Date();
        
        await course.save();
        results.push(course);
      } catch (error) {
        errors.push({ courseId: updateData.courseId, error: error.message });
      }
    }
    
    res.json({
      success: true,
      updated: results.length,
      errors: errors.length,
      data: results,
      errorDetails: errors,
      message: 'Updated ' + results.length + ' courses, ' + errors.length + ' failed'
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/courses/:id/assign-instructor - Assign instructor to course
export async function assignInstructor(req, res, next) {
  try {
    const { id } = req.params;
    const { instructorId, instructorName } = req.body;
    
    const course = await Course.findOne({ courseId: id });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    course.instructorId = instructorId;
    if (instructorName) course.instructor = instructorName;
    course.updatedBy = (req.user && req.user.id) || null;
    course.lastUpdatedAt = new Date();
    
    await course.save();
    
    res.json({
      success: true,
      data: course,
      message: 'Instructor assigned successfully'
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/courses/:id/prerequisites - Add prerequisite to course
export async function addPrerequisite(req, res, next) {
  try {
    const { id } = req.params;
    const { prerequisiteCode, prerequisiteId } = req.body;
    
    const course = await Course.findOne({ courseId: id });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Add prerequisite by code
    if (prerequisiteCode) {
      const prereq = await Course.findOne({ code: prerequisiteCode.toUpperCase() });
      if (!prereq) {
        return res.status(404).json({
          success: false,
          message: 'Prerequisite course not found'
        });
      }
      if (!course.prerequisites.includes(prereq.code)) {
        course.prerequisites.push(prereq.code);
        if (prereq._id && !course.prerequisitesCourses.includes(prereq._id)) {
          course.prerequisitesCourses.push(prereq._id);
        }
      }
    } else if (prerequisiteId) {
      const prereq = await Course.findOne({ courseId: prerequisiteId });
      if (!prereq) {
        return res.status(404).json({
          success: false,
          message: 'Prerequisite course not found'
        });
      }
      if (!course.prerequisites.includes(prereq.code)) {
        course.prerequisites.push(prereq.code);
        if (prereq._id && !course.prerequisitesCourses.includes(prereq._id)) {
          course.prerequisitesCourses.push(prereq._id);
        }
      }
    }
    
    course.updatedBy = (req.user && req.user.id) || null;
    course.lastUpdatedAt = new Date();
    await course.save();
    
    res.json({
      success: true,
      data: course,
      message: 'Prerequisite added successfully'
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/courses/:id/enroll - Enroll student in course
export async function enrollStudent(req, res, next) {
  try {
    const { id } = req.params;
    const { studentId } = req.body;
    
    const course = await Course.findOne({ courseId: id });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check if course is full
    if (course.enrolledStudents >= course.capacity) {
      course.waitlistCount += 1;
      await course.save();
      return res.json({
        success: true,
        message: 'Course is full. Student added to waitlist',
        data: course
      });
    }
    
    course.enrolledStudents += 1;
    course.updatedBy = (req.user && req.user.id) || null;
    course.lastUpdatedAt = new Date();
    await course.save();
    
    res.json({
      success: true,
      data: course,
      message: 'Student enrolled successfully'
    });
  } catch (err) {
    next(err);
  }
}

// ==================== UPDATE COURSES ====================

// PUT /api/courses/:id - Update course
export async function updateCourse(req, res, next) {
  try {
    const { id } = req.params;
    
    const existing = await Course.findOne({ courseId: id });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Course ' + id + ' not found'
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
          message: 'Course with code ' + req.body.code + ' already exists'
        });
      }
    }

    if (req.body.department) {
      const deptExists = await Department.findOne({ name: req.body.department });
      if (!deptExists) {
        return res.status(400).json({
          success: false,
          message: 'Department \'' + req.body.department + '\' not found'
        });
      }
      req.body.departmentName = req.body.department;
    }

    // Recalculate total fee if credits or feePerCredit changed
    if (req.body.credits || req.body.feePerCredit) {
      const credits = req.body.credits || existing.credits;
      const feePerCredit = req.body.feePerCredit || existing.feePerCredit;
      req.body.totalFee = credits * feePerCredit;
    }

    req.body.updatedBy = (req.user && req.user.id) || null;
    req.body.lastUpdatedAt = new Date();

    const { courseId, ...updateData } = req.body;
    
    const course = await Course.findOneAndUpdate(
      { courseId: id },
      updateData,
      { new: true, runValidators: true }
    )
    .populate('instructorId', 'name email')
    .populate('prerequisitesCourses', 'code name')
    .select('-__v');

    res.json({
      success: true,
      data: course
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(function(e) { return e.message; });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    next(err);
  }
}

// PUT /api/courses/:id/fee - Update course fee only
export async function updateCourseFee(req, res, next) {
  try {
    const { id } = req.params;
    const { feePerCredit, isFeeApplied, feeType } = req.body;
    
    const course = await Course.findOne({ courseId: id });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    if (feePerCredit !== undefined) {
      course.feePerCredit = feePerCredit;
      course.totalFee = course.credits * feePerCredit;
    }
    if (isFeeApplied !== undefined) course.isFeeApplied = isFeeApplied;
    if (feeType !== undefined) course.feeType = feeType;
    
    course.updatedBy = (req.user && req.user.id) || null;
    course.lastUpdatedAt = new Date();
    
    await course.save();
    
    res.json({
      success: true,
      data: course,
      message: 'Course fee updated successfully'
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/courses/:id/capacity - Update course capacity
export async function updateCourseCapacity(req, res, next) {
  try {
    const { id } = req.params;
    const { capacity } = req.body;
    
    if (!capacity || capacity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be at least 1'
      });
    }
    
    const course = await Course.findOne({ courseId: id });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    course.capacity = capacity;
    course.updatedBy = (req.user && req.user.id) || null;
    course.lastUpdatedAt = new Date();
    await course.save();
    
    res.json({
      success: true,
      data: course,
      message: 'Course capacity updated successfully'
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/courses/:id/schedule - Update course schedule
export async function updateCourseSchedule(req, res, next) {
  try {
    const { id } = req.params;
    const { schedule } = req.body;
    
    const course = await Course.findOne({ courseId: id });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    course.schedule = schedule;
    course.updatedBy = (req.user && req.user.id) || null;
    course.lastUpdatedAt = new Date();
    await course.save();
    
    res.json({
      success: true,
      data: course,
      message: 'Course schedule updated successfully'
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/courses/:id/toggle - Toggle course status
export async function toggleCourseStatus(req, res, next) {
  try {
    const { id } = req.params;
    
    const course = await Course.findOne({ courseId: id });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    course.isActive = !course.isActive;
    course.status = course.isActive ? 'Active' : 'Inactive';
    course.updatedBy = (req.user && req.user.id) || null;
    course.lastUpdatedAt = new Date();
    
    await course.save();
    
    res.json({
      success: true,
      data: course,
      message: 'Course ' + (course.isActive ? 'activated' : 'deactivated') + ' successfully'
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/courses/bulk/status - Bulk update course status
export async function bulkUpdateCourseStatus(req, res, next) {
  try {
    const { courseIds, status, isActive } = req.body;
    
    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of course IDs'
      });
    }
    
    const updateData = { 
      lastUpdatedAt: new Date(),
      updatedBy: (req.user && req.user.id) || null 
    };
    
    if (status !== undefined) updateData.status = status;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const result = await Course.updateMany(
      { courseId: { $in: courseIds } },
      updateData
    );
    
    res.json({
      success: true,
      message: 'Updated ' + result.modifiedCount + ' courses',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/courses/:id/fee-waiver - Apply fee waiver to course
export async function applyFeeWaiver(req, res, next) {
  try {
    const { id } = req.params;
    const { waiverPercentage, waiverReason } = req.body;
    
    if (!waiverPercentage || waiverPercentage <= 0 || waiverPercentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Waiver percentage must be between 1 and 100'
      });
    }
    
    const course = await Course.findOne({ courseId: id });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Apply waiver by reducing fee per credit
    const originalFee = course.feePerCredit;
    const discountedFee = originalFee * (1 - waiverPercentage / 100);
    course.feePerCredit = Math.round(discountedFee);
    course.totalFee = course.credits * course.feePerCredit;
    
    course.updatedBy = (req.user && req.user.id) || null;
    course.lastUpdatedAt = new Date();
    await course.save();
    
    res.json({
      success: true,
      data: {
        course: course,
        waiverApplied: {
          percentage: waiverPercentage,
          originalFee: originalFee,
          newFee: course.feePerCredit,
          reason: waiverReason || 'No reason provided'
        }
      },
      message: 'Fee waiver of ' + waiverPercentage + '% applied successfully'
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/courses/:id/fee-waiver - Remove fee waiver from course
export async function removeFeeWaiver(req, res, next) {
  try {
    const { id } = req.params;
    
    const course = await Course.findOne({ courseId: id });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Restore original fee (you'd need to store original fee in schema)
    // For now, we'll just set a message
    res.json({
      success: true,
      message: 'Fee waiver removed. Please update fee manually if needed.',
      data: course
    });
  } catch (err) {
    next(err);
  }
}

// ==================== DELETE COURSES ====================

// DELETE /api/courses/:id - Delete course
export async function deleteCourse(req, res, next) {
  try {
    const { id } = req.params;
    const course = await Course.findOneAndDelete({ courseId: id });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course ' + id + ' not found'
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

// DELETE /api/courses/bulk - Bulk delete courses
export async function bulkDeleteCourses(req, res, next) {
  try {
    const { courseIds, softDelete = true } = req.body;
    
    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of course IDs'
      });
    }
    
    let result;
    if (softDelete) {
      // Soft delete - mark as inactive
      result = await Course.updateMany(
        { courseId: { $in: courseIds } },
        { 
          isActive: false, 
          status: 'Inactive',
          lastUpdatedAt: new Date(),
          updatedBy: (req.user && req.user.id) || null
        }
      );
    } else {
      // Hard delete - remove permanently
      result = await Course.deleteMany({ courseId: { $in: courseIds } });
    }
    
    res.json({
      success: true,
      message: 'Deleted ' + (softDelete ? result.modifiedCount : result.deletedCount) + ' courses',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/courses/:id/instructor - Remove instructor from course
export async function removeInstructor(req, res, next) {
  try {
    const { id } = req.params;
    
    const course = await Course.findOne({ courseId: id });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    course.instructorId = null;
    course.instructor = '';
    course.updatedBy = (req.user && req.user.id) || null;
    course.lastUpdatedAt = new Date();
    await course.save();
    
    res.json({
      success: true,
      data: course,
      message: 'Instructor removed successfully'
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/courses/:id/prerequisites/:prerequisiteId - Remove prerequisite
export async function removePrerequisite(req, res, next) {
  try {
    const { id, prerequisiteId } = req.params;
    
    const course = await Course.findOne({ courseId: id });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Remove from prerequisites array
    const prereq = await Course.findOne({ courseId: prerequisiteId });
    if (prereq) {
      course.prerequisites = course.prerequisites.filter(function(p) {
        return p !== prereq.code;
      });
      course.prerequisitesCourses = course.prerequisitesCourses.filter(function(p) {
        return p.toString() !== prereq._id.toString();
      });
    }
    
    course.updatedBy = (req.user && req.user.id) || null;
    course.lastUpdatedAt = new Date();
    await course.save();
    
    res.json({
      success: true,
      data: course,
      message: 'Prerequisite removed successfully'
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/courses/:id/drop/:studentId - Drop student from course
export async function dropStudent(req, res, next) {
  try {
    const { id, studentId } = req.params;
    
    const course = await Course.findOne({ courseId: id });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    if (course.enrolledStudents > 0) {
      course.enrolledStudents -= 1;
    }
    
    // If there are students on waitlist, enroll the next one
    if (course.waitlistCount > 0) {
      course.waitlistCount -= 1;
      course.enrolledStudents += 1;
    }
    
    course.updatedBy = (req.user && req.user.id) || null;
    course.lastUpdatedAt = new Date();
    await course.save();
    
    res.json({
      success: true,
      data: course,
      message: 'Student dropped successfully'
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/courses/:id/textbooks/:textbookId - Remove textbook
export async function removeTextbook(req, res, next) {
  try {
    const { id, textbookId } = req.params;
    
    const course = await Course.findOne({ courseId: id });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    course.textbooks = course.textbooks.filter(function(_, index) {
      return index.toString() !== textbookId;
    });
    course.updatedBy = (req.user && req.user.id) || null;
    course.lastUpdatedAt = new Date();
    await course.save();
    
    res.json({
      success: true,
      data: course,
      message: 'Textbook removed successfully'
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/courses/:id/learning-outcomes/:outcomeId - Remove learning outcome
export async function removeLearningOutcome(req, res, next) {
  try {
    const { id, outcomeId } = req.params;
    
    const course = await Course.findOne({ courseId: id });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    course.learningOutcomes = course.learningOutcomes.filter(function(_, index) {
      return index.toString() !== outcomeId;
    });
    course.updatedBy = (req.user && req.user.id) || null;
    course.lastUpdatedAt = new Date();
    await course.save();
    
    res.json({
      success: true,
      data: course,
      message: 'Learning outcome removed successfully'
    });
  } catch (err) {
    next(err);
  }
}

// ==================== TEXTBOOK & LEARNING OUTCOMES ====================

// POST /api/courses/:id/textbooks - Add textbook
export async function addTextbook(req, res, next) {
  try {
    const { id } = req.params;
    const { title, author, isbn, edition } = req.body;
    
    const course = await Course.findOne({ courseId: id });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    course.textbooks.push({ title, author, isbn, edition });
    course.updatedBy = (req.user && req.user.id) || null;
    course.lastUpdatedAt = new Date();
    await course.save();
    
    res.json({
      success: true,
      data: course,
      message: 'Textbook added successfully'
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/courses/:id/learning-outcomes - Add learning outcome
export async function addLearningOutcome(req, res, next) {
  try {
    const { id } = req.params;
    const { outcome } = req.body;
    
    const course = await Course.findOne({ courseId: id });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    course.learningOutcomes.push(outcome);
    course.updatedBy = (req.user && req.user.id) || null;
    course.lastUpdatedAt = new Date();
    await course.save();
    
    res.json({
      success: true,
      data: course,
      message: 'Learning outcome added successfully'
    });
  } catch (err) {
    next(err);
  }
}

// ==================== SEED FUNCTIONS ====================

// GET /api/courses/seeded - Check if courses are seeded
export async function checkSeeded(req, res, next) {
  try {
    const count = await Course.countDocuments();
    res.json({
      success: true,
      seeded: count > 0,
      count: count
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/courses/seed - Seed all courses
export async function seedAllCourses(req, res, next) {
  try {
    // Check existing courses. Allow forced reseed with ?force=true
    const count = await Course.countDocuments();
    if (req.query.force === 'true' && count > 0) {
      await Course.deleteMany({});
    }

    // Define all courses - 5 Programs x 8 Semesters x 5 Courses each = 200 courses
    const courseData = [];

    // Helper function to generate courses for a program
    const generateProgramCourses = function(programCode, programName, department) {
      const courses = [];
      const baseFee = {
        'BSCS': { fee: 5000, dept: 'Computer Science' },
        'BSSE': { fee: 5000, dept: 'Software Engineering' },
        'BSIT': { fee: 4500, dept: 'Information Technology' },
        'BSEE': { fee: 5500, dept: 'Electrical Engineering' },
        'BBA': { fee: 4500, dept: 'Business Administration' }
      };

      const feeInfo = baseFee[programCode] || { fee: 4500, dept: department };
      const deptName = feeInfo.dept;
      const baseFeeAmount = feeInfo.fee;

      const semesterCourses = {
        1: [
          { code: programCode + '-101', name: programName + ' Fundamentals' },
          { code: programCode + '-102', name: programName + ' Mathematics' },
          { code: programCode + '-103', name: 'English Composition' },
          { code: programCode + '-104', name: 'Introduction to Computing' },
          { code: programCode + '-105', name: 'Islamic Studies' }
        ],
        2: [
          { code: programCode + '-106', name: 'Object Oriented Programming' },
          { code: programCode + '-107', name: 'Discrete Structures' },
          { code: programCode + '-108', name: 'Digital Logic Design' },
          { code: programCode + '-109', name: 'Communication Skills' },
          { code: programCode + '-110', name: 'Pakistan Studies' }
        ],
        3: [
          { code: programCode + '-201', name: 'Data Structures' },
          { code: programCode + '-202', name: programName + ' Requirements' },
          { code: programCode + '-203', name: 'Database Systems' },
          { code: programCode + '-204', name: 'Linear Algebra' },
          { code: programCode + '-205', name: 'Probability & Statistics' }
        ],
        4: [
          { code: programCode + '-206', name: programName + ' Design & Architecture' },
          { code: programCode + '-207', name: 'Operating Systems' },
          { code: programCode + '-208', name: 'Web Engineering' },
          { code: programCode + '-209', name: programName + ' Construction' },
          { code: programCode + '-210', name: 'Human Computer Interaction' }
        ],
        5: [
          { code: programCode + '-301', name: programName + ' Quality' },
          { code: programCode + '-302', name: programName + ' Project Management' },
          { code: programCode + '-303', name: 'Computer Networks' },
          { code: programCode + '-304', name: programName + ' Testing' },
          { code: programCode + '-305', name: programName + ' Architecture' }
        ],
        6: [
          { code: programCode + '-306', name: 'Artificial Intelligence' },
          { code: programCode + '-307', name: programName + ' Engineering' },
          { code: programCode + '-308', name: 'Information Security' },
          { code: programCode + '-309', name: 'Mobile Application Development' },
          { code: programCode + '-310', name: programName + ' Management' }
        ],
        7: [
          { code: programCode + '-401', name: programName + ' Cloud' },
          { code: programCode + '-402', name: 'Agile ' + programName },
          { code: programCode + '-403', name: programName + ' Metrics' },
          { code: programCode + '-404', name: programName + ' Maintenance' },
          { code: programCode + '-405', name: 'Final Year Project I' }
        ],
        8: [
          { code: programCode + '-406', name: programName + ' Reengineering' },
          { code: programCode + '-407', name: 'Enterprise Development' },
          { code: programCode + '-408', name: programName + ' Process Improvement' },
          { code: programCode + '-409', name: 'Professional Practices' },
          { code: programCode + '-410', name: 'Final Year Project II' }
        ]
      };

      for (let sem = 1; sem <= 8; sem++) {
        const semCourses = semesterCourses[sem] || [];
        const semesterType = sem % 2 === 1 ? 'Fall' : 'Spring';
        const year = 2024 + Math.floor((sem - 1) / 2);
        
        semCourses.forEach(function(course, index) {
          const feePerCredit = baseFeeAmount + (sem > 4 ? 500 : 0) + (index % 2 === 0 ? 0 : -500);
          const credits = sem === 8 && index === 3 ? 2 : 3; // Professional Practices has 2 credits
          courses.push({
            code: course.code,
            name: course.name,
            department: deptName,
            program: programCode,
            semester: sem,
            credits: credits,
            feePerCredit: feePerCredit,
            totalFee: credits * feePerCredit,
            status: 'Active',
            isActive: true,
            capacity: 30,
            enrolledStudents: 0,
            semesterType: semesterType,
            year: year,
            departmentName: deptName
          });
        });
      }
      return courses;
    };

    // Generate courses for all programs
    const programs = [
      { code: 'BSCS', name: 'Computer Science' },
      { code: 'BSSE', name: 'Software Engineering' },
      { code: 'BSIT', name: 'Information Technology' },
      { code: 'BSEE', name: 'Electrical Engineering' },
      { code: 'BBA', name: 'Business Administration' }
    ];

    programs.forEach(function(prog) {
      const courses = generateProgramCourses(prog.code, prog.name, prog.name);
      courseData.push.apply(courseData, courses);
    });

    // Prepare courseData: ensure unique courseId, totalFee and timestamps before insertMany
    let startIndex = 1;
    const lastCourse = await Course.findOne().sort({ courseId: -1 });
    if (lastCourse && lastCourse.courseId) {
      const m = lastCourse.courseId.match(/CRS-(\d+)/);
      if (m) startIndex = parseInt(m[1], 10) + 1;
    }

    const prepared = courseData.map(function(c, i) {
      return {
        ...c,
        courseId: 'CRS-' + String(startIndex + i).padStart(4, '0'),
        totalFee: (c.credits || 0) * (c.feePerCredit || 0),
        lastUpdatedAt: new Date()
      };
    });

    // Insert all courses using unordered inserts so valid docs still save
    let insertedCount = 0;
    try {
      const result = await Course.insertMany(prepared, { ordered: false });
      insertedCount = result.length;
    } catch (insertErr) {
      // ordered:false will insert valid docs and throw for duplicates/validation
      console.warn('⚠️ Partial insert during seeding courses:', insertErr.message || insertErr);
      // Count how many were actually inserted by checking courseId values we generated
      const inserted = await Course.find({ courseId: { $in: prepared.map(function(p) { return p.courseId; }) } });
      insertedCount = inserted.length;
    }

    // Return the courses that now exist for the seeded courseIds
    const createdCourses = await Course.find({ courseId: { $in: prepared.map(function(p) { return p.courseId; }) } }).sort({ program: 1, semester: 1, code: 1 });

    res.status(201).json({
      success: true,
      message: 'Seeding completed. Inserted ' + insertedCount + ' courses',
      count: insertedCount,
      data: createdCourses
    });
  } catch (err) {
    console.error('❌ Error seeding courses:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to seed courses',
      error: err.message
    });
  }
}

