// backend/src/controllers/dashboard.controller.js
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Admission from '../models/Admission.js';
import Attendance from '../models/Attendance.js';
import Fee from '../models/Fee.js';
import Employee from '../models/Employee.js';
import Leave from '../models/Leave.js';
import Department from '../models/Department.js';
import Course from '../models/Course.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Fetching dashboard statistics...');
    
    // Get counts from all collections
    const [totalStudents, totalTeachers, totalDepartments, totalCourses, totalAdmissions, totalEmployees] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Department?.countDocuments() || 0,
      Course?.countDocuments() || 0,
      Admission.countDocuments(),
      Employee.countDocuments()
    ]);

    // Get active students
    const activeStudents = await Student.countDocuments({ status: 'Active' });
    
    // Get pending admissions
    const pendingAdmissions = await Admission.countDocuments({ status: 'Pending' });
    
    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    });
    
    // Get fee collection stats
    const totalFees = await Fee.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get department distribution
    const departmentDistribution = await Student.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get admission status distribution
    const admissionStatus = await Admission.aggregate([
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
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// Get recent activities
export const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const [students, admissions, leaves, employees] = await Promise.all([
      Student.find().sort({ createdAt: -1 }).limit(limit),
      Admission.find().sort({ createdAt: -1 }).limit(limit),
      Leave.find().sort({ createdAt: -1 }).limit(limit),
      Employee.find().sort({ createdAt: -1 }).limit(limit)
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
  } catch (error) {
    console.error('❌ Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities',
      error: error.message
    });
  }
};

// Get dashboard overview
export const getDashboardOverview = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalDepartments = await Department?.countDocuments() || 0;
    const totalCourses = await Course?.countDocuments() || 0;
    
    const activeStudents = await Student.countDocuments({ status: 'Active' });
    const pendingAdmissions = await Admission.countDocuments({ status: 'Pending' });
    const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow }
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
  } catch (error) {
    console.error('❌ Error fetching dashboard overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard overview',
      error: error.message
    });
  }
};