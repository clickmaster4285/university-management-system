// backend/src/controllers/dashboard.controller.js
import { handle } from "../utils/asyncHandler.js";

// Get dashboard statistics
import { Admission, Attendance, Course, Department, Employee, Fee, Leave, Student, Teacher } from "../models/index.js";
export const getDashboardStats = handle(async (req, res) => {
  
  // Get counts from all collections
  const [totalStudents, totalTeachers, totalDepartments, totalCourses, totalAdmissions, totalEmployees] = await Promise.all([
    Student.countDocuments({ isDeleted: { $ne: true } }),
    Teacher.countDocuments({ isDeleted: { $ne: true } }),
    Department?.countDocuments({ isDeleted: { $ne: true } }) || 0,
    Course?.countDocuments({ isDeleted: { $ne: true } }) || 0,
    Admission.countDocuments({ isDeleted: { $ne: true } }),
    Employee.countDocuments({ isDeleted: { $ne: true } })
  ]);

  // Get active students
  const activeStudents = await Student.countDocuments({ status: 'Active', isDeleted: { $ne: true } });
  
  // Get pending admissions
  const pendingAdmissions = await Admission.countDocuments({ status: 'Pending', isDeleted: { $ne: true } });
  
  // Get today's attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayAttendance = await Attendance.countDocuments({
    date: { $gte: today, $lt: tomorrow },
    isDeleted: { $ne: true }
  });
  
  // Get fee collection stats
  const totalFees = await Fee.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  // Get department distribution
  const departmentDistribution = await Student.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  // Get admission status distribution
  const admissionStatus = await Admission.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        totalTeachers: totalTeachers || 0,
        totalDepartments: totalDepartments || 0,
        totalCourses: totalCourses || 0,
        totalAdmissions: totalAdmissions || 0,
        totalEmployees: totalEmployees || 0,
        pendingAdmissions: pendingAdmissions || 0,
        todayAttendance: todayAttendance || 0
      },
      finance: {
        totalFees: totalFees[0]?.total || 0,
        paidFees: 0,
        pendingFees: 0
      },
      recentActivities: {
        students: [],
        admissions: [],
        leaves: []
      },
      charts: {
        departmentDistribution: departmentDistribution || [],
        programDistribution: [],
        enrollmentTrend: [],
        admissionStatus: admissionStatus || [],
        attendance: {
          total: 0,
          present: 0,
          absent: 0,
          late: 0
        }
      }
    }
  });
});

// Get recent activities
export const getRecentActivities = handle(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const [students, admissions, leaves, employees] = await Promise.all([
    Student.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(limit),
    Admission.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(limit),
    Leave.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(limit),
    Employee.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(limit)
  ]);
  
  // Combine and sort all activities
  const activities = [
    ...students.map(s => ({
      id: s._id,
      type: 'student',
      title: `New student enrolled: ${s.name}`,
      description: `${s.program} - ${s.department}`,
      timestamp: s.createdAt,
      icon: 'UserPlus',
      color: 'blue'
    })),
    ...admissions.map(a => ({
      id: a._id,
      type: 'admission',
      title: `New admission application: ${a.name}`,
      description: `${a.program} - Status: ${a.status}`,
      timestamp: a.createdAt,
      icon: 'FileText',
      color: 'purple'
    })),
    ...leaves.map(l => ({
      id: l._id,
      type: 'leave',
      title: `Leave request: ${l.employeeName}`,
      description: `${l.type} - ${l.status}`,
      timestamp: l.createdAt,
      icon: 'Calendar',
      color: 'amber'
    })),
    ...employees.map(e => ({
      id: e._id,
      type: 'employee',
      title: `New employee: ${e.name}`,
      description: `${e.designation} - ${e.department}`,
      timestamp: e.createdAt,
      icon: 'Users',
      color: 'green'
    }))
  ];
  
  // Sort by timestamp descending
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  res.status(200).json({
    success: true,
    data: activities.slice(0, limit)
  });
});

// Get dashboard overview
export const getDashboardOverview = handle(async (req, res) => {
  const totalStudents = await Student.countDocuments({ isDeleted: { $ne: true } });
  const totalTeachers = await Teacher.countDocuments({ isDeleted: { $ne: true } });
  const totalDepartments = await Department?.countDocuments({ isDeleted: { $ne: true } }) || 0;
  const totalCourses = await Course?.countDocuments({ isDeleted: { $ne: true } }) || 0;
  
  const activeStudents = await Student.countDocuments({ status: 'Active', isDeleted: { $ne: true } });
  const pendingAdmissions = await Admission.countDocuments({ status: 'Pending', isDeleted: { $ne: true } });
  const pendingLeaves = await Leave.countDocuments({ status: 'Pending', isDeleted: { $ne: true } });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayAttendance = await Attendance.countDocuments({
    date: { $gte: today, $lt: tomorrow },
    isDeleted: { $ne: true }
  });
  
  res.status(200).json({
    success: true,
    data: {
      totalStudents,
      totalTeachers,
      totalDepartments,
      totalCourses,
      activeStudents,
      pendingAdmissions,
      pendingLeaves,
      todayAttendance
    }
  });
});
