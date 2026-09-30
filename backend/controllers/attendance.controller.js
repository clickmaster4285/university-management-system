import mongoose from 'mongoose';
import { handle } from "../utils/asyncHandler.js";
import { Attendance, Student, Enrollment } from '../models/index.js';
import { resolveOfferingAcademicFields } from '../utils/resolveOfferingAcademicFields.js';

const dayRange = (dateInput) => {
  const start = dateInput ? new Date(dateInput) : new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

// GET /api/attendance - Get attendance with filters
export const getAttendance = handle(async (req, res) => {
  const { 
    date, 
    program, 
    semester, 
    departmentId,
    offeringId,
    batchId,
    academicSessionId,
    status,
    studentId,
    page = 1, 
    limit = 10 
  } = req.query;
  
  const filter = { isDeleted: { $ne: true } };
  if (date) {
    const { start, end } = dayRange(date);
    filter.date = { $gte: start, $lt: end };
  }
  if (program) filter.program = program;
  if (semester) filter.semester = parseInt(semester);
  if (departmentId) filter.departmentId = departmentId;
  if (offeringId && mongoose.Types.ObjectId.isValid(offeringId)) {
    filter.offeringId = offeringId;
  }
  if (batchId && mongoose.Types.ObjectId.isValid(batchId)) {
    filter.batchId = batchId;
  }
  if (academicSessionId && mongoose.Types.ObjectId.isValid(academicSessionId)) {
    filter.academicSessionId = academicSessionId;
  }
  if (status) filter.status = status;
  if (studentId) filter.studentId = studentId;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const attendance = await Attendance.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ date: -1, createdAt: -1 })
    .select('-__v');

  const totalCount = await Attendance.countDocuments(filter);

  res.json({
    success: true,
    count: attendance.length,
    total: totalCount,
    page: parseInt(page),
    totalPages: Math.ceil(totalCount / parseInt(limit)),
    data: attendance
  });
});

// GET /api/attendance/students - Roster from Enrollments for an offering
export const getStudentsForAttendance = handle(async (req, res) => {
  const { offeringId, date } = req.query;

  if (!offeringId || !mongoose.Types.ObjectId.isValid(offeringId)) {
    return res.status(400).json({
      success: false,
      message: "offeringId is required"
    });
  }

  const resolved = await resolveOfferingAcademicFields(offeringId);
  if (!resolved) {
    return res.status(404).json({
      success: false,
      message: "Course offering not found"
    });
  }

  const enrollments = await Enrollment.find({
    offeringId,
    status: 'Enrolled',
    isDeleted: { $ne: true },
  })
    .populate('studentId', 'name email program semester department status')
    .lean();

  const students = enrollments
    .map((e) => e.studentId)
    .filter((s) => s && s.status !== 'Inactive' && s.isDeleted !== true);

  const { start, end } = dayRange(date);
  const markDate = start.toISOString().split('T')[0];

  const studentIds = students.map((s) => s._id);
  const existingAttendance = await Attendance.find({
    studentId: { $in: studentIds },
    offeringId,
    date: { $gte: start, $lt: end },
    isDeleted: { $ne: true },
  });

  const attendanceByStudent = {};
  existingAttendance.forEach((att) => {
    attendanceByStudent[att.studentId.toString()] = att;
  });

  const studentsWithStatus = students.map((student) => {
    const existing = attendanceByStudent[student._id.toString()];
    return {
      _id: student._id,
      name: student.name,
      email: student.email,
      program: student.program || resolved.program || '',
      semester: student.semester || resolved.semester,
      department: student.department || resolved.department || '',
      attendanceStatus: existing?.status || 'Not Marked',
      attendanceId: existing?._id || null,
    };
  }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const totalStudents = studentsWithStatus.length;
  const presentCount = existingAttendance.filter((a) => a.status === 'Present').length;
  const absentCount = existingAttendance.filter((a) => a.status === 'Absent').length;
  const lateCount = existingAttendance.filter((a) => a.status === 'Late').length;
  const leaveCount = existingAttendance.filter((a) => a.status === 'Leave').length;
  const notMarkedCount = totalStudents - existingAttendance.length;

  res.json({
    success: true,
    data: {
      students: studentsWithStatus,
      offering: {
        _id: resolved.offeringId,
        course: resolved.course,
        courseCode: resolved.courseCode,
        program: resolved.program,
        semester: resolved.semester,
        academicYear: resolved.academicYear,
      },
      summary: {
        total: totalStudents,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        leave: leaveCount,
        notMarked: notMarkedCount,
        date: markDate
      }
    }
  });
});

// POST /api/attendance/mark - Mark attendance for offering roster
export const markAttendance = handle(async (req, res) => {
  const { attendance, date, offeringId, markedBy } = req.body;
  
  if (!attendance || !Array.isArray(attendance) || attendance.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Attendance data is required"
    });
  }

  if (!offeringId || !mongoose.Types.ObjectId.isValid(offeringId)) {
    return res.status(400).json({
      success: false,
      message: "offeringId is required"
    });
  }

  const resolved = await resolveOfferingAcademicFields(offeringId);
  if (!resolved) {
    return res.status(400).json({
      success: false,
      message: "Course offering not found"
    });
  }

  const { start, end } = dayRange(date);
  const attendanceDate = start;

  const results = [];
  const errors = [];

  for (const record of attendance) {
    try {
      const { studentId, status, remarks } = record;
      
      const student = await Student.findOne({ _id: studentId, isDeleted: { $ne: true } });
      if (!student) {
        errors.push({ studentId, error: 'Student not found' });
        continue;
      }

      const enrolled = await Enrollment.findOne({
        studentId,
        offeringId,
        status: 'Enrolled',
        isDeleted: { $ne: true },
      });
      if (!enrolled) {
        errors.push({ studentId, error: 'Student is not enrolled in this offering' });
        continue;
      }

      const existing = await Attendance.findOne({
        studentId,
        offeringId,
        date: { $gte: start, $lt: end },
        isDeleted: { $ne: true },
      });

      let attendanceRecord;
      if (existing) {
        existing.status = status || 'Present';
        existing.remarks = remarks || existing.remarks;
        existing.markedBy = markedBy || existing.markedBy;
        existing.course = resolved.course || existing.course;
        existing.courseCode = resolved.courseCode || existing.courseCode;
        existing.subjectId = resolved.subjectId;
        existing.programId = resolved.programId;
        existing.batchId = resolved.batchId;
        existing.academicSessionId = resolved.academicSessionId;
        existing.program = resolved.program || existing.program;
        existing.semester = resolved.semester || existing.semester;
        existing.department = resolved.department || existing.department;
        attendanceRecord = await existing.save();
      } else {
        const newAttendance = new Attendance({
          studentId,
          studentName: student.name,
          studentEmail: student.email,
          offeringId: resolved.offeringId,
          subjectId: resolved.subjectId,
          programId: resolved.programId,
          batchId: resolved.batchId,
          academicSessionId: resolved.academicSessionId,
          courseCode: resolved.courseCode,
          program: resolved.program || student.program || '',
          semester: resolved.semester || student.semester,
          department: resolved.department || student.department || '',
          date: attendanceDate,
          status: status || 'Present',
          remarks: remarks || '',
          markedBy: markedBy || 'Admin',
          course: resolved.course || '',
        });
        attendanceRecord = await newAttendance.save();
      }

      results.push(attendanceRecord);
    } catch (err) {
      errors.push({ studentId: record.studentId, error: err.message });
    }
  }

  res.status(201).json({
    success: true,
    message: `Attendance marked: ${results.length} successful, ${errors.length} failed`,
    data: {
      successful: results,
      errors,
      summary: {
        total: attendance.length,
        successful: results.length,
        failed: errors.length
      }
    }
  });
});

// GET /api/attendance/stats - Get attendance statistics
export const getAttendanceStats = handle(async (req, res) => {
  const { program, semester, departmentId, offeringId, batchId, academicSessionId, startDate, endDate } = req.query;
  
  const filter = { isDeleted: { $ne: true } };
  if (program) filter.program = program;
  if (semester) filter.semester = parseInt(semester);
  if (departmentId) filter.departmentId = departmentId;
  if (offeringId && mongoose.Types.ObjectId.isValid(offeringId)) filter.offeringId = new mongoose.Types.ObjectId(offeringId);
  if (batchId && mongoose.Types.ObjectId.isValid(batchId)) filter.batchId = new mongoose.Types.ObjectId(batchId);
  if (academicSessionId && mongoose.Types.ObjectId.isValid(academicSessionId)) {
    filter.academicSessionId = new mongoose.Types.ObjectId(academicSessionId);
  }
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.date = { $gte: start, $lte: end };
  }

  const stats = await Attendance.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          status: "$status"
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: "$_id.date",
        statuses: {
          $push: {
            status: "$_id.status",
            count: "$count"
          }
        },
        total: { $sum: "$count" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const overall = await Attendance.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
        leave: { $sum: { $cond: [{ $eq: ['$status', 'Leave'] }, 1, 0] } }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      dailyStats: stats,
      overall: overall[0] || {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0
      }
    }
  });
});

// GET /api/attendance/:id - Get attendance by ID
export const getAttendanceById = handle(async (req, res) => {
  const attendance = await Attendance.findOne({ attendanceId: req.params.id, isDeleted: { $ne: true } });
  
  if (!attendance) {
    return res.status(404).json({
      success: false,
      message: `Attendance record ${req.params.id} not found`
    });
  }
  
  res.json({ success: true, data: attendance });
});

// PUT /api/attendance/:id - Update attendance
export const updateAttendance = handle(async (req, res) => {
  const { id } = req.params;
  
  const existing = await Attendance.findOne({ attendanceId: id, isDeleted: { $ne: true } });
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: `Attendance record ${id} not found`
    });
  }

  const { attendanceId, ...updateData } = req.body;
  delete updateData._id;
  delete updateData.createdAt;
  delete updateData.updatedAt;
  delete updateData.isDeleted;
  delete updateData.deletedAt;
  delete updateData.deletedBy;
  
  const attendance = await Attendance.findOneAndUpdate(
    { attendanceId: id, isDeleted: { $ne: true } },
    updateData,
    { new: true, runValidators: true }
  ).select('-__v');

  res.json({
    success: true,
    data: attendance
  });
});

// DELETE /api/attendance/:id - Delete attendance
export const deleteAttendance = handle(async (req, res) => {
  const { id } = req.params;
  const attendance = await Attendance.findOne({ attendanceId: id, isDeleted: { $ne: true } });
  
  if (!attendance) {
    return res.status(404).json({
      success: false,
      message: `Attendance record ${id} not found`
    });
  }

  await attendance.deleteOne();

  res.json({
    success: true,
    message: "Attendance record deleted successfully",
    data: attendance
  });
});

// GET /api/attendance/student/:studentId - Get student attendance history
export const getStudentAttendanceHistory = handle(async (req, res) => {
  const { studentId } = req.params;
  const { limit = 30 } = req.query;
  
  const attendance = await Attendance.find({ studentId, isDeleted: { $ne: true } })
    .sort({ date: -1 })
    .limit(parseInt(limit))
    .select('-__v');

  const stats = await Attendance.aggregate([
    { $match: { studentId: new mongoose.Types.ObjectId(studentId), isDeleted: { $ne: true } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
        leave: { $sum: { $cond: [{ $eq: ['$status', 'Leave'] }, 1, 0] } }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      history: attendance,
      stats: stats[0] || {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0
      }
    }
  });
});
