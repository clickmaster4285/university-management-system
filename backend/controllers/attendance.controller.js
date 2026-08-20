import Attendance from '../models/academic/Attendance.js';
import Student from '../models/academic/Student.js';
import mongoose from 'mongoose';

// GET /api/attendance - Get attendance with filters
export async function getAttendance(req, res, next) {
  try {
    const { 
      date, 
      program, 
      semester, 
      department, 
      status,
      studentId,
      page = 1, 
      limit = 10 
    } = req.query;
    
    const filter = {};
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }
    if (program) filter.program = program;
    if (semester) filter.semester = parseInt(semester);
    if (department) filter.department = department;
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
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/students - Get students by program and semester
export async function getStudentsForAttendance(req, res, next) {
  try {
    const { program, semester, department } = req.query;
    
    if (!program || !semester || !department) {
      return res.status(400).json({
        success: false,
        message: "Program, semester and department are required"
      });
    }

    // Get students matching the criteria
    const students = await Student.find({
      program: program,
      semester: parseInt(semester),
      department: department,
      status: 'Active'
    })
    .select('_id name email program semester department')
    .sort({ name: 1 });

    // Check if attendance already marked for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const studentIds = students.map(s => s._id);
    const existingAttendance = await Attendance.find({
      studentId: { $in: studentIds },
      date: { $gte: today, $lt: tomorrow }
    });

    // Map existing attendance status
    const attendanceMap = {};
    existingAttendance.forEach(att => {
      attendanceMap[att.studentId.toString()] = att.status;
    });

    // Add attendance status to each student
    const studentsWithStatus = students.map(student => ({
      ...student.toObject(),
      attendanceStatus: attendanceMap[student._id.toString()] || 'Not Marked',
      attendanceId: existingAttendance.find(
        att => att.studentId.toString() === student._id.toString()
      )?._id || null
    }));

    // Get today's date for display
    const todayDate = new Date().toISOString().split('T')[0];

    // Get attendance statistics
    const totalStudents = students.length;
    const presentCount = existingAttendance.filter(a => a.status === 'Present').length;
    const absentCount = existingAttendance.filter(a => a.status === 'Absent').length;
    const lateCount = existingAttendance.filter(a => a.status === 'Late').length;
    const leaveCount = existingAttendance.filter(a => a.status === 'Leave').length;
    const notMarkedCount = totalStudents - existingAttendance.length;

    res.json({
      success: true,
      data: {
        students: studentsWithStatus,
        summary: {
          total: totalStudents,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          leave: leaveCount,
          notMarked: notMarkedCount,
          date: todayDate
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/attendance/mark - Mark attendance for multiple students
export async function markAttendance(req, res, next) {
  try {
    const { attendance, date, program, semester, department, markedBy, course } = req.body;
    
    if (!attendance || !Array.isArray(attendance) || attendance.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Attendance data is required"
      });
    }

    if (!program || !semester || !department) {
      return res.status(400).json({
        success: false,
        message: "Program, semester and department are required"
      });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    // Process each attendance record
    const results = [];
    const errors = [];

    for (const record of attendance) {
      try {
        const { studentId, status, remarks } = record;
        
        // Check if student exists
        const student = await Student.findById(studentId);
        if (!student) {
          errors.push({ studentId, error: 'Student not found' });
          continue;
        }

        // Check if attendance already exists for this student today
        const existing = await Attendance.findOne({
          studentId: studentId,
          date: { $gte: attendanceDate, $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000) }
        });

        let attendanceRecord;
        if (existing) {
          // Update existing attendance
          existing.status = status || 'Present';
          existing.remarks = remarks || existing.remarks;
          existing.markedBy = markedBy || existing.markedBy;
          if (course) existing.course = course;
          attendanceRecord = await existing.save();
        } else {
          // Create new attendance record
          const newAttendance = new Attendance({
            studentId: studentId,
            studentName: student.name,
            studentEmail: student.email,
            program: student.program,
            semester: student.semester,
            department: student.department,
            date: attendanceDate,
            status: status || 'Present',
            remarks: remarks || '',
            markedBy: markedBy || 'Admin',
            course: course || ''
          });
          attendanceRecord = await newAttendance.save();
        }

        results.push(attendanceRecord);
      } catch (err) {
        errors.push({ studentId: record.studentId, error: err.message });
      }
    }

    // Get summary
    const totalRecords = attendance.length;
    const successful = results.length;
    const failed = errors.length;

    res.status(201).json({
      success: true,
      message: `Attendance marked: ${successful} successful, ${failed} failed`,
      data: {
        successful: results,
        errors: errors,
        summary: {
          total: totalRecords,
          successful: successful,
          failed: failed
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/stats - Get attendance statistics
export async function getAttendanceStats(req, res, next) {
  try {
    const { program, semester, department, startDate, endDate } = req.query;
    
    const filter = {};
    if (program) filter.program = program;
    if (semester) filter.semester = parseInt(semester);
    if (department) filter.department = department;
    
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

    // Get overall summary
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
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/:id - Get attendance by ID
export async function getAttendanceById(req, res, next) {
  try {
    const attendance = await Attendance.findOne({ attendanceId: req.params.id });
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: `Attendance record ${req.params.id} not found`
      });
    }
    
    res.json({ success: true, data: attendance });
  } catch (err) {
    next(err);
  }
}

// PUT /api/attendance/:id - Update attendance
export async function updateAttendance(req, res, next) {
  try {
    const { id } = req.params;
    
    const existing = await Attendance.findOne({ attendanceId: id });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Attendance record ${id} not found`
      });
    }

    const { attendanceId, ...updateData } = req.body;
    
    const attendance = await Attendance.findOneAndUpdate(
      { attendanceId: id },
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    res.json({
      success: true,
      data: attendance
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/attendance/:id - Delete attendance
export async function deleteAttendance(req, res, next) {
  try {
    const { id } = req.params;
    const attendance = await Attendance.findOneAndDelete({ attendanceId: id });
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: `Attendance record ${id} not found`
      });
    }

    res.json({
      success: true,
      message: "Attendance record deleted successfully",
      data: attendance
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/student/:studentId - Get student attendance history
export async function getStudentAttendanceHistory(req, res, next) {
  try {
    const { studentId } = req.params;
    const { limit = 30 } = req.query;
    
    const attendance = await Attendance.find({ studentId })
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .select('-__v');

    const stats = await Attendance.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
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
  } catch (err) {
    next(err);
  }
}