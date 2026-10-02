// backend/src/controllers/dashboard.controller.js
import { handle } from "../utils/asyncHandler.js";
import {
  Attendance,
  CourseOffering,
  Department,
  Fee,
  StaffLeave,
  StaffMember,
  Student,
  StudentApplication,
} from "../models/index.js";

const PENDING_APPLICATION_STATUSES = ['Submitted', 'Under Review', 'Shortlisted'];

// Get dashboard statistics
export const getDashboardStats = handle(async (req, res) => {
  const [
    totalStudents,
    totalTeachers,
    totalDepartments,
    totalOfferings,
    totalAdmissions,
    totalEmployees,
  ] = await Promise.all([
    Student.countDocuments({ isDeleted: { $ne: true } }),
    StaffMember.countDocuments({ isDeleted: { $ne: true }, isAcademic: true }),
    Department.countDocuments({ isDeleted: { $ne: true } }),
    CourseOffering.countDocuments({ isDeleted: { $ne: true } }),
    StudentApplication.countDocuments({ isDeleted: { $ne: true } }),
    StaffMember.countDocuments({ isDeleted: { $ne: true } }),
  ]);

  const activeStudents = await Student.countDocuments({ status: 'Active', isDeleted: { $ne: true } });

  const pendingAdmissions = await StudentApplication.countDocuments({
    status: { $in: PENDING_APPLICATION_STATUSES },
    isDeleted: { $ne: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAttendance = await Attendance.countDocuments({
    date: { $gte: today, $lt: tomorrow },
    isDeleted: { $ne: true },
  });

  const totalFees = await Fee.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const departmentDistribution = await Student.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const admissionStatus = await StudentApplication.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        totalTeachers: totalTeachers || 0,
        totalDepartments: totalDepartments || 0,
        totalOfferings: totalOfferings || 0,
        totalAdmissions: totalAdmissions || 0,
        totalEmployees: totalEmployees || 0,
        pendingAdmissions: pendingAdmissions || 0,
        todayAttendance: todayAttendance || 0,
      },
      finance: {
        totalFees: totalFees[0]?.total || 0,
        paidFees: 0,
        pendingFees: 0,
      },
      recentActivities: {
        students: [],
        admissions: [],
        leaves: [],
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
          late: 0,
        },
      },
    },
  });
});

// Get recent activities
export const getRecentActivities = handle(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const [students, applications, leaves, employees] = await Promise.all([
    Student.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(limit),
    StudentApplication.find({ isDeleted: { $ne: true } })
      .populate('programId', 'name code')
      .sort({ createdAt: -1 })
      .limit(limit),
    StaffLeave.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(limit),
    StaffMember.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(limit),
  ]);

  const activities = [
    ...students.map((s) => ({
      id: s._id,
      type: 'student',
      title: `New student enrolled: ${s.name}`,
      description: `${s.program} - ${s.department}`,
      timestamp: s.createdAt,
      icon: 'UserPlus',
      color: 'blue',
    })),
    ...applications.map((a) => {
      const programLabel =
        (a.programId && typeof a.programId === 'object' && a.programId.name) ||
        a.programId?.toString() ||
        'Program';
      return {
        id: a._id,
        type: 'admission',
        title: `New admission application: ${a.firstName} ${a.lastName}`.trim(),
        description: `${programLabel} - Status: ${a.status}`,
        timestamp: a.createdAt,
        icon: 'FileText',
        color: 'purple',
      };
    }),
    ...leaves.map((l) => ({
      id: l._id,
      type: 'leave',
      title: `Leave request: ${l.staffName}`,
      description: `${l.type} - ${l.status}`,
      timestamp: l.createdAt,
      icon: 'Calendar',
      color: 'amber',
    })),
    ...employees.map((e) => {
      const primaryEmployment =
        e.employments?.find((item) => item.isPrimary) || e.employments?.[0];
      return {
        id: e._id,
        type: 'employee',
        title: `New employee: ${e.firstName} ${e.lastName}`.trim(),
        description: `${primaryEmployment?.designation || 'Staff'} - ${e.status || ''}`,
        timestamp: e.createdAt,
        icon: 'Users',
        color: 'green',
      };
    }),
  ];

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.status(200).json({
    success: true,
    data: activities.slice(0, limit),
  });
});

// Get dashboard overview
export const getDashboardOverview = handle(async (req, res) => {
  const totalStudents = await Student.countDocuments({ isDeleted: { $ne: true } });
  const totalTeachers = await StaffMember.countDocuments({
    isDeleted: { $ne: true },
    isAcademic: true,
  });
  const totalDepartments = await Department.countDocuments({ isDeleted: { $ne: true } });
  const totalOfferings = await CourseOffering.countDocuments({ isDeleted: { $ne: true } });

  const activeStudents = await Student.countDocuments({ status: 'Active', isDeleted: { $ne: true } });
  const pendingAdmissions = await StudentApplication.countDocuments({
    status: { $in: PENDING_APPLICATION_STATUSES },
    isDeleted: { $ne: true },
  });
  const pendingLeaves = await StaffLeave.countDocuments({
    status: 'Pending',
    isDeleted: { $ne: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAttendance = await Attendance.countDocuments({
    date: { $gte: today, $lt: tomorrow },
    isDeleted: { $ne: true },
  });

  res.status(200).json({
    success: true,
    data: {
      totalStudents,
      totalTeachers,
      totalDepartments,
      totalOfferings,
      activeStudents,
      pendingAdmissions,
      pendingLeaves,
      todayAttendance,
    },
  });
});
