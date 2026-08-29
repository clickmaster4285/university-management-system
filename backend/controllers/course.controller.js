import mongoose from 'mongoose';
import { handle } from "../utils/asyncHandler.js";
import { Course, Department, Teacher, Program, Assignment, Exam, Student } from '../models/index.js';
import { generateCourseId } from "../utils/generateCourseId.js";

const notDeleted = { $ne: true };
const COURSE_STATUSES = ['Active', 'Inactive', 'Completed', 'Cancelled', 'Draft'];
const FEE_TYPES = ['Tuition', 'Lab', 'Library', 'Sports', 'Transport', 'Hostel', 'Other'];
const SEMESTER_TYPES = ['Fall', 'Spring', 'Summer'];

async function findCourseByIdentifier(identifier) {
  const query = [{ courseId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return Course.findOne({ $or: query, isDeleted: notDeleted });
}

function syncActiveFromStatus(status) {
  return status === 'Active' || status === 'Completed';
}

function buildProgramFilter(programId, program) {
  if (programId) {
    return {
      $or: [
        { programId },
        { program: String(program || '').toUpperCase().trim() },
      ],
    };
  }
  if (program) {
    return { program: String(program).toUpperCase().trim() };
  }
  return null;
}

async function resolveProgramContext({ programId, program, departmentId }) {
  let resolvedProgram = null;

  if (programId) {
    resolvedProgram = await Program.findOne({ _id: programId, isDeleted: notDeleted });
    if (!resolvedProgram) {
      return { error: { status: 400, message: 'Program not found' } };
    }
  } else if (program) {
    resolvedProgram = await Program.findOne({
      code: String(program).toUpperCase().trim(),
      isDeleted: notDeleted,
    });
    if (!resolvedProgram) {
      return { error: { status: 400, message: `Program ${program} not found` } };
    }
  } else {
    return { error: { status: 400, message: 'programId or program is required' } };
  }

  if (departmentId && resolvedProgram.departmentId.toString() !== departmentId.toString()) {
    return {
      error: {
        status: 400,
        message: 'Program must belong to the selected department',
      },
    };
  }

  return {
    programId: resolvedProgram._id,
    program: resolvedProgram.code,
    departmentId: resolvedProgram.departmentId,
  };
}

async function validateInstructor(instructorId, departmentId) {
  if (!instructorId) return null;
  const teacher = await Teacher.findOne({ _id: instructorId, isDeleted: notDeleted });
  if (!teacher) {
    return { status: 400, message: 'Teacher not found for instructorId' };
  }
  if (departmentId && teacher.departmentId.toString() !== departmentId.toString()) {
    return { status: 400, message: 'Instructor must belong to the same department as the course' };
  }
  return null;
}

async function getCourseDeleteBlockers(course) {
  const [assignmentCount, examCount, enrolledStudentCount, prerequisiteCount] = await Promise.all([
    Assignment.countDocuments({
      isDeleted: notDeleted,
      $or: [{ courseCode: course.code }, { course: course.name }],
    }),
    Exam.countDocuments({
      isDeleted: notDeleted,
      $or: [{ courseCode: course.code }, { course: course.name }],
    }),
    Student.countDocuments({
      isDeleted: notDeleted,
      coursesEnrolled: course._id,
    }),
    Course.countDocuments({
      isDeleted: notDeleted,
      prerequisitesCourses: course._id,
      _id: { $ne: course._id },
    }),
  ]);

  const blockers = [];
  if (assignmentCount > 0) blockers.push({ type: 'assignments', count: assignmentCount });
  if (examCount > 0) blockers.push({ type: 'exams', count: examCount });
  if (enrolledStudentCount > 0) blockers.push({ type: 'enrolledStudents', count: enrolledStudentCount });
  if ((course.enrolledStudents || 0) > 0) {
    blockers.push({ type: 'courseEnrollmentCounter', count: course.enrolledStudents });
  }
  if (prerequisiteCount > 0) blockers.push({ type: 'prerequisites', count: prerequisiteCount });

  return blockers;
}

// GET /api/courses - Get all courses with filters
export const getCourses = handle(async (req, res) => {
  const {
    departmentId,
    programId,
    program,
    instructorId,
    code,
    status,
    semester,
    semesterType,
    year,
    search,
    page = 1,
    limit = 100,
    isActive,
    feeApplied,
  } = req.query;

  const filter = { isDeleted: notDeleted };
  if (departmentId) filter.departmentId = departmentId;
  if (instructorId) filter.instructorId = instructorId;
  if (code) filter.code = String(code).toUpperCase().trim();

  const programFilter = buildProgramFilter(programId, program);
  if (programFilter) Object.assign(filter, programFilter);

  if (status) filter.status = status;
  else if (isActive !== undefined) filter.status = isActive === 'true' ? 'Active' : 'Inactive';

  if (semester) filter.semester = parseInt(semester, 10);
  if (semesterType) filter.semesterType = semesterType;
  if (year) filter.year = parseInt(year, 10);
  if (feeApplied !== undefined) filter.isFeeApplied = feeApplied === 'true';

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { instructor: { $regex: search, $options: 'i' } },
      { courseId: { $regex: search, $options: 'i' } },
    ];
  }

  const parsedLimit = parseInt(limit, 10);
  const parsedPage = parseInt(page, 10);
  const skip = (parsedPage - 1) * parsedLimit;

  const [courses, totalCount] = await Promise.all([
    Course.find(filter)
      .skip(skip)
      .limit(parsedLimit)
      .sort({ code: 1 })
      .populate('departmentId', 'name code')
      .populate('programId', 'name code degreeLevel')
      .populate('instructorId', 'name email designation')
      .populate('prerequisitesCourses', 'code name')
      .select('-__v'),
    Course.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: courses.length,
    total: totalCount,
    page: parsedPage,
    totalPages: Math.ceil(totalCount / parsedLimit),
    data: courses,
  });
});

// GET /api/courses/active - Get active courses only
export const getActiveCourses = handle(async (req, res) => {
  const { departmentId, program, semester } = req.query;

  const filter = { isActive: true, status: 'Active', isDeleted: { $ne: true } };
  if (departmentId) filter.departmentId = departmentId;
  if (program) filter.program = program;
  if (semester) filter.semester = parseInt(semester);

  const courses = await Course.find(filter)
    .sort({ code: 1 })
    .populate('departmentId', 'name code')
    .select('code name credits feePerCredit totalFee program semester instructor capacity enrolledStudents');

  res.json({
    success: true,
    count: courses.length,
    data: courses
  });
});

// GET /api/courses/with-fee - Get courses with fee structure
export const getCoursesWithFee = handle(async (req, res) => {
  const { departmentId, program, semester } = req.query;

  const filter = { isActive: true, isFeeApplied: true, isDeleted: { $ne: true } };
  if (departmentId) filter.departmentId = departmentId;
  if (program) filter.program = program;
  if (semester) filter.semester = parseInt(semester);

  const courses = await Course.find(filter)
    .sort({ code: 1 })
    .populate('departmentId', 'name code')
    .select('code name credits feePerCredit totalFee feeType program semester');

  res.json({
    success: true,
    count: courses.length,
    data: courses
  });
});

// GET /api/courses/:id - Get course by ID
export const getCourseById = handle(async (req, res) => {
  const course = await findCourseByIdentifier(req.params.id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: `Course ${req.params.id} not found`,
    });
  }

  const populated = await Course.findById(course._id)
    .populate('departmentId', 'name code')
    .populate('programId', 'name code degreeLevel')
    .populate('instructorId', 'name email designation')
    .populate('prerequisitesCourses', 'code name')
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email')
    .select('-__v');

  res.json({ success: true, data: populated });
});

// GET /api/courses/code/:code - Get course by code
export const getCourseByCode = handle(async (req, res) => {
  const { code } = req.params;

  const course = await Course.findOne({
    code: code.toUpperCase(),
    isActive: true,
    isDeleted: { $ne: true }
  })
    .populate('departmentId', 'name code')
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

// GET /api/courses/department/:departmentId - Get courses by department
export const getCoursesByDepartment = handle(async (req, res) => {
  const { departmentId } = req.params;
  const { isActive = true } = req.query;

  const courses = await Course.find({
    departmentId,
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
    .populate('departmentId', 'name code')
    .select('code name credits feePerCredit totalFee semester');

  res.json({
    success: true,
    count: courses.length,
    data: courses
  });
});

// GET /api/courses/semester/:semester - Get courses by semester
export const getCoursesBySemester = handle(async (req, res) => {
  const { semester } = req.params;
  const { program, departmentId, isActive = true } = req.query;

  const filter = { semester: parseInt(semester), isActive: isActive === 'true', isDeleted: { $ne: true } };
  if (program) filter.program = program;
  if (departmentId) filter.departmentId = departmentId;

  const courses = await Course.find(filter)
    .sort({ code: 1 })
    .populate('departmentId', 'name code')
    .select('code name credits feePerCredit totalFee program');

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
      $lookup: {
        from: 'departments',
        localField: 'departmentId',
        foreignField: '_id',
        as: 'dept'
      }
    },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: {
          semester: '$semester',
          departmentId: '$departmentId',
          departmentName: '$dept.name'
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
        _id: '$_id.departmentId',
        departmentName: { $first: '$_id.departmentName' },
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
  const { departmentId, program } = req.query;

  const filter = { isActive: true, isFeeApplied: true, isDeleted: { $ne: true } };
  if (departmentId) filter.departmentId = departmentId;
  if (program) filter.program = program;

  const summary = await Course.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $match: filter },
    {
      $lookup: {
        from: 'departments',
        localField: 'departmentId',
        foreignField: '_id',
        as: 'dept'
      }
    },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: {
          departmentId: '$departmentId',
          departmentName: '$dept.name',
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
        _id: '$_id.departmentId',
        departmentName: { $first: '$_id.departmentName' },
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
  const { departmentId, program } = req.query;

  const filter = { isActive: true, isDeleted: { $ne: true } };
  if (departmentId) filter.departmentId = departmentId;
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
    .populate('departmentId', 'name code')
    .select('code name enrolledStudents capacity program');

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
      $lookup: {
        from: 'departments',
        localField: 'departmentId',
        foreignField: '_id',
        as: 'dept'
      }
    },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$departmentId',
        departmentName: { $first: '$dept.name' },
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
    { $match: { isDeleted: notDeleted } },
    {
      $lookup: {
        from: 'programs',
        localField: 'programId',
        foreignField: '_id',
        as: 'programDoc',
      },
    },
    { $unwind: { path: '$programDoc', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: {
          programId: '$programId',
          program: { $ifNull: ['$programDoc.code', '$program'] },
        },
        count: { $sum: 1 },
        totalEnrolled: { $sum: '$enrolledStudents' },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const enrollmentAgg = await Course.aggregate([
    { $match: { isDeleted: notDeleted, status: 'Active' } },
    {
      $group: {
        _id: null,
        totalEnrolled: { $sum: '$enrolledStudents' },
        totalCapacity: { $sum: '$capacity' },
        totalWaitlist: { $sum: '$waitlistCount' },
        fullCourses: {
          $sum: { $cond: [{ $gte: ['$enrolledStudents', '$capacity'] }, 1, 0] },
        },
        availableCourses: {
          $sum: { $cond: [{ $lt: ['$enrolledStudents', '$capacity'] }, 1, 0] },
        },
      },
    },
  ]);

  const topCourses = await Course.find({ isDeleted: notDeleted, status: 'Active' })
    .sort({ enrolledStudents: -1 })
    .limit(10)
    .populate('departmentId', 'name code')
    .select('code name enrolledStudents capacity program programId');

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
      byProgram: programStats,
      enrollment: {
        summary: enrollmentAgg[0] || {
          totalEnrolled: 0,
          totalCapacity: 0,
          totalWaitlist: 0,
          fullCourses: 0,
          availableCourses: 0,
        },
        topCourses,
      },
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
      students: []
    }
  });
});

// ==================== CREATE COURSES ====================

// POST /api/courses - Create new course
export const createCourse = handle(async (req, res) => {
  const {
    code,
    name,
    departmentId,
    credits,
    program,
    programId,
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
    schedule,
  } = req.body;

  if (!code || !name || !departmentId || !credits || !semester) {
    return res.status(400).json({
      success: false,
      message: 'code, name, departmentId, credits and semester are required',
    });
  }

  const programContext = await resolveProgramContext({ programId, program, departmentId });
  if (programContext.error) {
    return res.status(programContext.error.status).json({
      success: false,
      message: programContext.error.message,
    });
  }

  const dept = await Department.findOne({ _id: departmentId, isDeleted: notDeleted });
  if (!dept) {
    return res.status(400).json({
      success: false,
      message: 'Department not found. Please create the department first.',
    });
  }

  const normalizedCode = String(code).toUpperCase().trim();
  const duplicate = await Course.findOne({ code: normalizedCode });
  if (duplicate) {
    const message = duplicate.isDeleted
      ? 'A course with this code was previously deleted. Use a different code.'
      : `Course with code ${normalizedCode} already exists`;
    return res.status(duplicate.isDeleted ? 409 : 400).json({ success: false, message });
  }

  const instructorError = await validateInstructor(instructorId, departmentId);
  if (instructorError) {
    return res.status(instructorError.status).json({
      success: false,
      message: instructorError.message,
    });
  }

  const parsedCredits = Number(credits) || 3;
  const parsedSemester = Number(semester) || 1;
  const parsedFeePerCredit = Number(feePerCredit) || 0;
  const parsedCapacity = Number(capacity) || 30;
  const parsedEnrolled = Number(enrolledStudents) || 0;
  const parsedYear = Number(year) || new Date().getFullYear();
  const nextStatus = status && COURSE_STATUSES.includes(status) ? status : 'Active';

  let teacherName = instructor || '';
  if (instructorId) {
    const teacher = await Teacher.findById(instructorId).select('name');
    teacherName = teacher?.name || teacherName;
  }

  const course = new Course({
    courseId: await generateCourseId(),
    code: normalizedCode,
    name: String(name).trim(),
    departmentId: programContext.departmentId || departmentId,
    programId: programContext.programId,
    program: programContext.program,
    semester: parsedSemester,
    semesterType: semesterType && SEMESTER_TYPES.includes(semesterType) ? semesterType : 'Fall',
    year: parsedYear,
    credits: parsedCredits,
    feePerCredit: parsedFeePerCredit,
    totalFee: parsedCredits * parsedFeePerCredit,
    feeType: feeType && FEE_TYPES.includes(feeType) ? feeType : 'Tuition',
    isFeeApplied: isFeeApplied !== undefined ? isFeeApplied : true,
    instructor: teacherName,
    instructorId: instructorId || null,
    capacity: parsedCapacity,
    enrolledStudents: parsedEnrolled,
    waitlistCount: 0,
    status: nextStatus,
    isActive: syncActiveFromStatus(nextStatus),
    description: description || '',
    prerequisites: prerequisites || [],
    tags: tags || [],
    learningOutcomes: learningOutcomes || [],
    textbooks: textbooks || [],
    ...(schedule && typeof schedule === 'object' ? { schedule } : {}),
    createdBy: req.user?._id || null,
    lastUpdatedAt: new Date(),
  });

  await course.save();

  const populated = await Course.findById(course._id)
    .populate('departmentId', 'name code')
    .populate('programId', 'name code degreeLevel')
    .populate('instructorId', 'name email designation');

  res.status(201).json({
    success: true,
    data: populated,
    message: 'Course created successfully',
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

  const invalidCourses = courses.filter(function (c) {
    return !c.code || !c.name || !c.departmentId || !c.credits || !c.semester || (!c.program && !c.programId);
  });
  if (invalidCourses.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Each course must have code, name, departmentId, credits, semester and programId or program',
      invalidCount: invalidCourses.length
    });
  }

  const codes = courses.map(function (c) { return c.code.toUpperCase(); });
  const existingCodes = await Course.find({ code: { $in: codes }, isDeleted: { $ne: true } });
  if (existingCodes.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate course codes found',
      duplicates: existingCodes.map(function (c) { return c.code; })
    });
  }

  const deptIds = [...new Set(courses.map(function (c) { return c.departmentId; }))];
  const existingDepts = await Department.find({ _id: { $in: deptIds }, isDeleted: { $ne: true } });
  const existingDeptIds = existingDepts.map(function (d) { return d._id.toString(); });
  const missingDepts = deptIds.filter(function (d) {
    return !existingDeptIds.includes(d);
  });

  if (missingDepts.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Some departments do not exist',
      missingDepartments: missingDepts
    });
  }

  // Generate courseIds for all courses
  const lastCourse = await Course.findOne({ isDeleted: { $ne: true } }).sort({ courseId: -1 });
  let startIndex = 1;
  if (lastCourse && lastCourse.courseId) {
    const m = lastCourse.courseId.match(/CRS-(\d+)/);
    if (m) startIndex = parseInt(m[1], 10) + 1;
  }

  const coursesWithIds = courses.map(function (c, i) {
    return {
      ...c,
      courseId: 'CRS-' + String(startIndex + i).padStart(4, '0'),
      code: c.code.toUpperCase(),
      totalFee: (c.credits || 0) * (c.feePerCredit || 0),
      createdBy: (req.user && req.user._id) || null,
      lastUpdatedAt: new Date()
    };
  });

  const createdCourses = await Course.insertMany(coursesWithIds);

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

      const course = await Course.findOne({ courseId, isDeleted: { $ne: true } });
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

      course.updatedBy = (req.user && req.user._id) || null;
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

  if (instructorId) {
    const teacher = await Teacher.findOne({ _id: instructorId, isDeleted: { $ne: true } });
    if (!teacher) {
      return res.status(400).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    course.instructorId = instructorId;
    if (instructorName) course.instructor = instructorName;
    else course.instructor = teacher.name;
  } else {
    course.instructorId = null;
    course.instructor = instructorName || '';
  }

  course.updatedBy = (req.user && req.user._id) || null;
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

  if (prerequisiteCode) {
    const prereq = await Course.findOne({ code: prerequisiteCode.toUpperCase(), isDeleted: { $ne: true } });
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
    const prereq = await Course.findOne({ courseId: prerequisiteId, isDeleted: { $ne: true } });
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

  course.updatedBy = (req.user && req.user._id) || null;
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

  const course = await Course.findOne({ courseId: id, isDeleted: { $ne: true } });
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }

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
  course.updatedBy = (req.user && req.user._id) || null;
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
  const course = await findCourseByIdentifier(req.params.id);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: `Course ${req.params.id} not found`,
    });
  }

  const {
    code,
    name,
    departmentId,
    credits,
    program,
    programId,
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
    schedule,
  } = req.body;

  if (code !== undefined && code !== '') {
    const normalizedCode = String(code).toUpperCase().trim();
    const duplicate = await Course.findOne({
      code: normalizedCode,
      _id: { $ne: course._id },
    });
    if (duplicate) {
      const message = duplicate.isDeleted
        ? 'A course with this code was previously deleted. Use a different code.'
        : `Course with code ${normalizedCode} already exists`;
      return res.status(duplicate.isDeleted ? 409 : 400).json({ success: false, message });
    }
    course.code = normalizedCode;
  }

  if (name !== undefined && name !== '') course.name = String(name).trim();

  const nextDepartmentId = departmentId || course.departmentId;
  if (departmentId) {
    const dept = await Department.findOne({ _id: departmentId, isDeleted: notDeleted });
    if (!dept) {
      return res.status(400).json({ success: false, message: 'Department not found' });
    }
    course.departmentId = departmentId;
  }

  if (programId !== undefined || program !== undefined) {
    const programContext = await resolveProgramContext({
      programId: programId || course.programId,
      program: program || course.program,
      departmentId: nextDepartmentId,
    });
    if (programContext.error) {
      return res.status(programContext.error.status).json({
        success: false,
        message: programContext.error.message,
      });
    }
    course.programId = programContext.programId;
    course.program = programContext.program;
    course.departmentId = programContext.departmentId;
  }

  if (instructorId !== undefined) {
    const instructorError = await validateInstructor(instructorId, course.departmentId);
    if (instructorError) {
      return res.status(instructorError.status).json({
        success: false,
        message: instructorError.message,
      });
    }
    course.instructorId = instructorId || null;
    if (instructorId) {
      const teacher = await Teacher.findById(instructorId).select('name');
      course.instructor = teacher?.name || instructor || '';
    } else {
      course.instructor = instructor || '';
    }
  } else if (instructor !== undefined) {
    course.instructor = instructor;
  }

  if (credits !== undefined) course.credits = Number(credits) || course.credits;
  if (semester !== undefined) course.semester = Number(semester) || course.semester;
  if (semesterType !== undefined && SEMESTER_TYPES.includes(semesterType)) course.semesterType = semesterType;
  if (year !== undefined) course.year = Number(year) || course.year;
  if (feePerCredit !== undefined) course.feePerCredit = Number(feePerCredit) || 0;
  if (feeType !== undefined && FEE_TYPES.includes(feeType)) course.feeType = feeType;
  if (isFeeApplied !== undefined) course.isFeeApplied = isFeeApplied;
  if (capacity !== undefined) course.capacity = Number(capacity) || course.capacity;
  if (enrolledStudents !== undefined) course.enrolledStudents = Number(enrolledStudents) || 0;
  if (description !== undefined) course.description = description;
  if (prerequisites !== undefined) course.prerequisites = prerequisites;
  if (tags !== undefined) course.tags = tags;
  if (learningOutcomes !== undefined) course.learningOutcomes = learningOutcomes;
  if (textbooks !== undefined) course.textbooks = textbooks;
  if (schedule !== undefined) course.schedule = schedule;

  if (status !== undefined && COURSE_STATUSES.includes(status)) {
    course.status = status;
    course.isActive = syncActiveFromStatus(status);
  }

  course.totalFee = (course.credits || 0) * (course.feePerCredit || 0);
  course.updatedBy = req.user?._id || null;
  course.lastUpdatedAt = new Date();

  await course.save();

  const populated = await Course.findById(course._id)
    .populate('departmentId', 'name code')
    .populate('programId', 'name code degreeLevel')
    .populate('instructorId', 'name email designation')
    .populate('prerequisitesCourses', 'code name')
    .select('-__v');

  res.json({
    success: true,
    data: populated,
    message: 'Course updated successfully',
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

  course.updatedBy = (req.user && req.user._id) || null;
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
  course.updatedBy = (req.user && req.user._id) || null;
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
  course.updatedBy = (req.user && req.user._id) || null;
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
  course.updatedBy = (req.user && req.user._id) || null;
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
    updatedBy: (req.user && req.user._id) || null
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

  const originalFee = course.feePerCredit;
  const discountedFee = originalFee * (1 - waiverPercentage / 100);
  course.feePerCredit = Math.round(discountedFee);
  course.totalFee = course.credits * course.feePerCredit;

  course.updatedBy = (req.user && req.user._id) || null;
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

  res.json({
    success: true,
    message: 'Fee waiver removed. Please update fee manually if needed.',
    data: course
  });
});

// ==================== DELETE COURSES ====================

// DELETE /api/courses/:id - Delete course
export const deleteCourse = handle(async (req, res) => {
  const course = await findCourseByIdentifier(req.params.id);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: `Course ${req.params.id} not found`,
    });
  }

  const blockers = await getCourseDeleteBlockers(course);
  if (blockers.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete course while assignments, exams, enrollments, or prerequisites are still linked.',
      blockers,
    });
  }

  course.isDeleted = true;
  course.deletedAt = new Date();
  course.deletedBy = req.user?._id || null;
  course.status = 'Inactive';
  course.isActive = false;
  course.updatedBy = req.user?._id || null;
  course.lastUpdatedAt = new Date();
  await course.save();

  res.json({
    success: true,
    message: 'Course deleted successfully',
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
    result = await Course.updateMany(
      { courseId: { $in: courseIds } },
      {
        isActive: false,
        status: 'Inactive',
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: (req.user && req.user._id) || null,
        lastUpdatedAt: new Date(),
        updatedBy: (req.user && req.user._id) || null
      }
    );
  } else {
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
  course.updatedBy = (req.user && req.user._id) || null;
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

  const prereq = await Course.findOne({ courseId: prerequisiteId, isDeleted: { $ne: true } });
  if (prereq) {
    course.prerequisites = course.prerequisites.filter(function (p) {
      return p !== prereq.code;
    });
    course.prerequisitesCourses = course.prerequisitesCourses.filter(function (p) {
      return p.toString() !== prereq._id.toString();
    });
  }

  course.updatedBy = (req.user && req.user._id) || null;
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
  const { id } = req.params;

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

  if (course.waitlistCount > 0) {
    course.waitlistCount -= 1;
    course.enrolledStudents += 1;
  }

  course.updatedBy = (req.user && req.user._id) || null;
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

  course.textbooks = course.textbooks.filter(function (_, index) {
    return index.toString() !== textbookId;
  });
  course.updatedBy = (req.user && req.user._id) || null;
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

  course.learningOutcomes = course.learningOutcomes.filter(function (_, index) {
    return index.toString() !== outcomeId;
  });
  course.updatedBy = (req.user && req.user._id) || null;
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
  course.updatedBy = (req.user && req.user._id) || null;
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
  course.updatedBy = (req.user && req.user._id) || null;
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
  const count = await Course.countDocuments({ isDeleted: { $ne: true } });
  if (req.query.force === 'true' && count > 0) {
    await Course.deleteMany({});
  }

  const courseData = [];

  const generateProgramCourses = async function (programCode, programName, departmentName) {
    const courses = [];
    const baseFee = {
      'BSCS': { fee: 5000, dept: 'Computer Science' },
      'BSSE': { fee: 5000, dept: 'Software Engineering' },
      'BSIT': { fee: 4500, dept: 'Information Technology' },
      'BSEE': { fee: 5500, dept: 'Electrical Engineering' },
      'BBA': { fee: 4500, dept: 'Business Administration' }
    };

    const feeInfo = baseFee[programCode] || { fee: 4500, dept: departmentName };
    const baseFeeAmount = feeInfo.fee;

    // Lookup department by name to get _id
    const dept = await Department.findOne({ name: feeInfo.dept, isDeleted: { $ne: true } }).lean();
    const departmentId = dept ? dept._id : null;

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

      semCourses.forEach(function (course, index) {
        const feePerCredit = baseFeeAmount + (sem > 4 ? 500 : 0) + (index % 2 === 0 ? 0 : -500);
        const credits = sem === 8 && index === 3 ? 2 : 3;
        courses.push({
          code: course.code,
          name: course.name,
          departmentId: departmentId,
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
          year: year
        });
      });
    }
    return courses;
  };

  const programs = [
    { code: 'BSCS', name: 'Computer Science' },
    { code: 'BSSE', name: 'Software Engineering' },
    { code: 'BSIT', name: 'Information Technology' },
    { code: 'BSEE', name: 'Electrical Engineering' },
    { code: 'BBA', name: 'Business Administration' }
  ];

  for (const prog of programs) {
    const courses = await generateProgramCourses(prog.code, prog.name, prog.name);
    courseData.push.apply(courseData, courses);
  }

  let startIndex = 1;
  const lastCourse = await Course.findOne({ isDeleted: { $ne: true } }).sort({ courseId: -1 });
  if (lastCourse && lastCourse.courseId) {
    const m = lastCourse.courseId.match(/CRS-(\d+)/);
    if (m) startIndex = parseInt(m[1], 10) + 1;
  }

  const prepared = courseData.map(function (c, i) {
    return {
      ...c,
      courseId: 'CRS-' + String(startIndex + i).padStart(4, '0'),
      totalFee: (c.credits || 0) * (c.feePerCredit || 0),
      lastUpdatedAt: new Date()
    };
  });

  let insertedCount = 0;
  try {
    const result = await Course.insertMany(prepared, { ordered: false });
    insertedCount = result.length;
  } catch (insertErr) {
    console.warn('⚠️ Partial insert during seeding courses:', insertErr.message || insertErr);
    const inserted = await Course.find({ courseId: { $in: prepared.map(function (p) { return p.courseId; }) } });
    insertedCount = inserted.length;
  }

  const createdCourses = await Course.find({ courseId: { $in: prepared.map(function (p) { return p.courseId; }) } })
    .populate('departmentId', 'name code')
    .sort({ program: 1, semester: 1, code: 1 });

  res.status(201).json({
    success: true,
    message: 'Seeding completed. Inserted ' + insertedCount + ' courses',
    count: insertedCount,
    data: createdCourses
  });
});
