// backend/src/controllers/course.controller.js
import mongoose from 'mongoose';
import { handle } from "../utils/asyncHandler.js";

// ==================== GET COURSES ====================

// GET /api/courses - Get all courses with filters
import { Course, Department } from '../models/index.js';
export const getCourses = handle(async (req, res) => {
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
  
  const filter = { isDeleted: { $ne: true } };
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
});

// GET /api/courses/active - Get active courses only
export const getActiveCourses = handle(async (req, res) => {
  const { department, program, semester } = req.query;
  
  const filter = { isActive: true, status: 'Active', isDeleted: { $ne: true } };
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
});

// GET /api/courses/with-fee - Get courses with fee structure
export const getCoursesWithFee = handle(async (req, res) => {
  const { department, program, semester } = req.query;
  
  const filter = { isActive: true, isFeeApplied: true, isDeleted: { $ne: true } };
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
});

// GET /api/courses/:id - Get course by ID
export const getCourseById = handle(async (req, res) => {
  const course = await Course.findOne({ courseId: req.params.id, isDeleted: { $ne: true } })
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
});

// GET /api/courses/code/:code - Get course by code
export const getCourseByCode = handle(async (req, res) => {
  const { code } = req.params;
  
  const course = await Course.findOne({ 
    code: code.toUpperCase(),
    isActive: true,
    isDeleted: { $ne: true }
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
});

// GET /api/courses/department/:department - Get courses by department
export const getCoursesByDepartment = handle(async (req, res) => {
  const { department } = req.params;
  const { isActive = true } = req.query;
  
  const courses = await Course.find({ 
    departmentName: department,
    isActive: isActive === 'true',
    isDeleted: { $ne: true }
  })
  .sort({ code: 1 })
  .select('code name credits feePerCredit totalFee semester program');
  
  res.json({
    success: true,
    count: courses.length,
    data: courses
  });
});

// GET /api/courses/program/:program - Get courses by program
export const getCoursesByProgram = handle(async (req, res) => {
  const { program } = req.params;
  const { semester, isActive = true } = req.query;
  
  const filter = { program, isActive: isActive === 'true', isDeleted: { $ne: true } };
  if (semester) filter.semester = parseInt(semester);
  
  const courses = await Course.find(filter)
    .sort({ semester: 1, code: 1 })
    .select('code name credits feePerCredit totalFee semester departmentName');
  
  res.json({
    success: true,
    count: courses.length,
    data: courses
  });
});

// GET /api/courses/semester/:semester - Get courses by semester
export const getCoursesBySemester = handle(async (req, res) => {
  const { semester } = req.params;
  const { program, department, isActive = true } = req.query;
  
  const filter = { semester: parseInt(semester), isActive: isActive === 'true', isDeleted: { $ne: true } };
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
});

// GET /api/courses/instructor/:instructorId - Get courses by instructor
export const getCoursesByInstructor = handle(async (req, res) => {
  const { instructorId } = req.params;
  const { semester, isActive = true } = req.query;
  
  const filter = { 
    instructorId,
    isActive: isActive === 'true',
    isDeleted: { $ne: true }
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
});

// GET /api/courses/program/:program/fee-structure - Get program fee structure
export const getProgramFeeStructure = handle(async (req, res) => {
  const { program } = req.params;
  
  const result = await Course.aggregate([
    { $match: { isDeleted: { $ne: true } } },
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
});

// GET /api/courses/fee-summary - Get course fee summary
export const getCourseFeeSummary = handle(async (req, res) => {
  const { department, program } = req.query;
  
  const filter = { isActive: true, isFeeApplied: true, isDeleted: { $ne: true } };
  if (department) filter.departmentName = department;
  if (program) filter.program = program;
  
  const summary = await Course.aggregate([
    { $match: { isDeleted: { $ne: true } } },
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
});

// GET /api/courses/enrollment-stats - Get course enrollment statistics
export const getCourseEnrollmentStats = handle(async (req, res) => {
  const { department, program } = req.query;
  
  const filter = { isActive: true, isDeleted: { $ne: true } };
  if (department) filter.departmentName = department;
  if (program) filter.program = program;
  
  const stats = await Course.aggregate([
    { $match: { isDeleted: { $ne: true } } },
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
});

// GET /api/courses/stats - Get course statistics
export const getCourseStats = handle(async (req, res) => {
  const stats = await Course.aggregate([
    { $match: { isDeleted: { $ne: true } } },
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

  const active = await Course.countDocuments({ status: 'Active', isDeleted: { $ne: true } });
  const inactive = await Course.countDocuments({ status: 'Inactive', isDeleted: { $ne: true } });
  const completed = await Course.countDocuments({ status: 'Completed', isDeleted: { $ne: true } });
  const cancelled = await Course.countDocuments({ status: 'Cancelled', isDeleted: { $ne: true } });
  const draft = await Course.countDocuments({ status: 'Draft', isDeleted: { $ne: true } });

  const deptStats = await Course.aggregate([
    { $match: { isDeleted: { $ne: true } } },
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
    { $match: { isDeleted: { $ne: true } } },
    {
      $group: {
        _id: '$semester',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const programStats = await Course.aggregate([
    { $match: { isDeleted: { $ne: true } } },
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
});

// GET /api/courses/:id/fee-breakdown - Get course fee breakdown
export const getCourseFeeBreakdown = handle(async (req, res) => {
  const { id } = req.params;
  
  const course = await Course.findOne({ courseId: id, isDeleted: { $ne: true } })
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
});

// GET /api/courses/:id/schedule - Get course schedule
export const getCourseSchedule = handle(async (req, res) => {
  const { id } = req.params;
  
  const course = await Course.findOne({ courseId: id, isDeleted: { $ne: true } }).select('schedule code name');
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
});

// GET /api/courses/:id/enrollments - Get course enrollments
export const getCourseEnrollments = handle(async (req, res) => {
  const { id } = req.params;
  
  const course = await Course.findOne({ courseId: id, isDeleted: { $ne: true } })
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
});

// ==================== CREATE COURSES ====================

// POST /api/courses - Create new course
export const createCourse = handle(async (req, res) => {
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
});

// POST /api/courses/bulk - Bulk create courses
export const createBulkCourses = handle(async (req, res) => {
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
});

// POST /api/courses/bulk/fee - Bulk update course fees
export const bulkUpdateCourseFees = handle(async (req, res) => {
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
});

// POST /api/courses/:id/assign-instructor - Assign instructor to course
export const assignInstructor = handle(async (req, res) => {
  const { id } = req.params;
  const { instructorId, instructorName } = req.body;
  
  const course = await Course.findOne({ courseId: id, isDeleted: { $ne: true } });
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
});

// POST /api/courses/:id/prerequisites - Add prerequisite to course
export const addPrerequisite = handle(async (req, res) => {
  const { id } = req.params;
  const { prerequisiteCode, prerequisiteId } = req.body;
  
  const course = await Course.findOne({ courseId: id, isDeleted: { $ne: true } });
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
});

// POST /api/courses/:id/enroll - Enroll student in course
export const enrollStudent = handle(async (req, res) => {
  const { id } = req.params;
  const { studentId } = req.body;
  
  const course = await Course.findOne({ courseId: id, isDeleted: { $ne: true } });
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
});

// ==================== UPDATE COURSES ====================

// PUT /api/courses/:id - Update course
export const updateCourse = handle(async (req, res) => {
  const { id } = req.params;
  
  const existing = await Course.findOne({ courseId: id, isDeleted: { $ne: true } });
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

  const { courseId, isDeleted, deletedAt, deletedBy, _id, createdAt, updatedAt, ...updateData } = req.body;
  
  const course = await Course.findOneAndUpdate(
    { courseId: id, isDeleted: { $ne: true } },
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
});

// PUT /api/courses/:id/fee - Update course fee only
export const updateCourseFee = handle(async (req, res) => {
  const { id } = req.params;
  const { feePerCredit, isFeeApplied, feeType } = req.body;
  
  const course = await Course.findOne({ courseId: id, isDeleted: { $ne: true } });
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
});

// PUT /api/courses/:id/capacity - Update course capacity
export const updateCourseCapacity = handle(async (req, res) => {
  const { id } = req.params;
  const { capacity } = req.body;
  
  if (!capacity || capacity < 1) {
    return res.status(400).json({
      success: false,
      message: 'Capacity must be at least 1'
    });
  }
  
  const course = await Course.findOne({ courseId: id, isDeleted: { $ne: true } });
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
});

// PUT /api/courses/:id/schedule - Update course schedule
export const updateCourseSchedule = handle(async (req, res) => {
  const { id } = req.params;
  const { schedule } = req.body;
  
  const course = await Course.findOne({ courseId: id, isDeleted: { $ne: true } });
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
});

// PATCH /api/courses/:id/toggle - Toggle course status
export const toggleCourseStatus = handle(async (req, res) => {
  const { id } = req.params;
  
  const course = await Course.findOne({ courseId: id, isDeleted: { $ne: true } });
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
});

// PATCH /api/courses/bulk/status - Bulk update course status
export const bulkUpdateCourseStatus = handle(async (req, res) => {
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
});

// POST /api/courses/:id/fee-waiver - Apply fee waiver to course
export const applyFeeWaiver = handle(async (req, res) => {
  const { id } = req.params;
  const { waiverPercentage, waiverReason } = req.body;
  
  if (!waiverPercentage || waiverPercentage <= 0 || waiverPercentage > 100) {
    return res.status(400).json({
      success: false,
      message: 'Waiver percentage must be between 1 and 100'
    });
  }
  
  const course = await Course.findOne({ courseId: id, isDeleted: { $ne: true } });
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
});

// DELETE /api/courses/:id/fee-waiver - Remove fee waiver from course
export const removeFeeWaiver = handle(async (req, res) => {
  const { id } = req.params;
  
  const course = await Course.findOne({ courseId: id, isDeleted: { $ne: true } });
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
});

// ==================== DELETE COURSES ====================

// DELETE /api/courses/:id - Delete course
export const deleteCourse = handle(async (req, res) => {
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
});

// DELETE /api/courses/bulk - Bulk delete courses
export const bulkDeleteCourses = handle(async (req, res) => {
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
});

// DELETE /api/courses/:id/instructor - Remove instructor from course
export const removeInstructor = handle(async (req, res) => {
  const { id } = req.params;
  
  const course = await Course.findOne({ courseId: id, isDeleted: { $ne: true } });
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
});

// DELETE /api/courses/:id/prerequisites/:prerequisiteId - Remove prerequisite
export const removePrerequisite = handle(async (req, res) => {
  const { id, prerequisiteId } = req.params;
  
  const course = await Course.findOne({ courseId: id, isDeleted: { $ne: true } });
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }
  
  // Remove from prerequisites array
  const prereq = await Course.findOne({ courseId: prerequisiteId, isDeleted: { $ne: true } });
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
});

// DELETE /api/courses/:id/drop/:studentId - Drop student from course
export const dropStudent = handle(async (req, res) => {
  const { id, studentId } = req.params;
  
  const course = await Course.findOne({ courseId: id, isDeleted: { $ne: true } });
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
});

// DELETE /api/courses/:id/textbooks/:textbookId - Remove textbook
export const removeTextbook = handle(async (req, res) => {
  const { id, textbookId } = req.params;
  
  const course = await Course.findOne({ courseId: id, isDeleted: { $ne: true } });
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
});

// DELETE /api/courses/:id/learning-outcomes/:outcomeId - Remove learning outcome
export const removeLearningOutcome = handle(async (req, res) => {
  const { id, outcomeId } = req.params;
  
  const course = await Course.findOne({ courseId: id, isDeleted: { $ne: true } });
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
});

// ==================== TEXTBOOK & LEARNING OUTCOMES ====================

// POST /api/courses/:id/textbooks - Add textbook
export const addTextbook = handle(async (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, edition } = req.body;
  
  const course = await Course.findOne({ courseId: id, isDeleted: { $ne: true } });
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
});

// POST /api/courses/:id/learning-outcomes - Add learning outcome
export const addLearningOutcome = handle(async (req, res) => {
  const { id } = req.params;
  const { outcome } = req.body;
  
  const course = await Course.findOne({ courseId: id, isDeleted: { $ne: true } });
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
});

// ==================== SEED FUNCTIONS ====================

// GET /api/courses/seeded - Check if courses are seeded
export const checkSeeded = handle(async (req, res) => {
  const count = await Course.countDocuments({ isDeleted: { $ne: true } });
  res.json({
    success: true,
    seeded: count > 0,
    count: count
  });
});

// POST /api/courses/seed - Seed all courses
export const seedAllCourses = handle(async (req, res) => {
  // Check existing courses. Allow forced reseed with ?force=true
  const count = await Course.countDocuments({ isDeleted: { $ne: true } });
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
  const lastCourse = await Course.findOne({ isDeleted: { $ne: true } }).sort({ courseId: -1 });
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
});
