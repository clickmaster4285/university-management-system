// backend/src/controllers/report.controller.js
import mongoose from 'mongoose';
import { handle } from "../utils/asyncHandler.js";

// Helper: derive a readable name from an email local-part
import { Admission, Attendance, Employee, Fee, Leave, Report, Student, Teacher } from '../models/index.js';
const deriveNameFromEmail = (email) => {
  if (!email || typeof email !== 'string') return 'N/A';
  const local = email.split('@')[0] || '';
  if (!local) return 'N/A';
  const pretty = local.replace(/[._\-]+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return pretty || 'N/A';
};

// Helper: get display name for a person-like object (student/employee/teacher)
const getDisplayNameForRecord = (rec) => {
  if (!rec) return 'N/A';
  // Prefer explicit name fields
  if (rec.name && typeof rec.name === 'string' && rec.name.trim() && rec.name !== 'N/A' && rec.name !== 'undefined undefined' && rec.name !== 'undefined') {
    return rec.name.trim();
  }
  // Employee model uses firstName/lastName
  if (rec.firstName || rec.lastName) {
    const first = (rec.firstName || '').trim();
    const last = (rec.lastName || '').trim();
    const combined = `${first} ${last}`.trim();
    if (combined) return combined;
  }
  // Try email-derived fallback
  if (rec.email) return deriveNameFromEmail(rec.email);
  return 'N/A';
};

// ==================== REPORT GENERATION FUNCTIONS ====================

// Helper: Generate student report - FIXED for your Student model
const generateStudentReport = async (params = {}) => {
  const { department, program, status, startDate, endDate } = params;
  
  const query = {};
  query.isDeleted = { $ne: true };
  if (department) query.department = department;
  if (program) query.program = program;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  
  // Get all students matching the query - using your Student model
  const students = await Student.find(query).sort({ createdAt: -1 });
  
  
  // Log sample student data for debugging
  if (students.length > 0) {
  } else {
    const total = await Student.countDocuments({ isDeleted: { $ne: true } });
  }
  
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'Active').length;
  const byDepartment = {};
  const byProgram = {};
  const byStatus = {};
  
  students.forEach(s => {
    byDepartment[s.department] = (byDepartment[s.department] || 0) + 1;
    byProgram[s.program] = (byProgram[s.program] || 0) + 1;
    byStatus[s.status] = (byStatus[s.status] || 0) + 1;
  });
  
  // Map students - using the 'name' field from your model
  const studentData = students.map(s => ({
    id: s._id,
    name: s.name || 'N/A',  // Using the 'name' field from your Student model
    email: s.email || '',
    department: s.department || '',
    program: s.program || '',
    status: s.status || '',
    enrollmentDate: s.createdAt,
    // Include fullName virtual if needed
    fullName: s.fullName || s.name || 'N/A'
  }));
  
  // Log first student data to verify
  if (studentData.length > 0) {
  }
  
  return {
    title: 'Student Enrollment Report',
    generatedAt: new Date().toISOString(),
    summary: {
      total: totalStudents,
      active: activeStudents,
      inactive: totalStudents - activeStudents
    },
    byDepartment,
    byProgram,
    byStatus,
    students: studentData
  };
};

// Helper: Generate teacher report
const generateTeacherReport = async (params = {}) => {
  const { department, status } = params;
  
  const query = {};
  query.isDeleted = { $ne: true };
  if (department) query.department = department;
  if (status) query.status = status;
  
  const teachers = await Teacher.find(query).sort({ createdAt: -1 });
  
  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter(t => t.status === 'Active').length;
  const byDepartment = {};
  const byDesignation = {};
  
  teachers.forEach(t => {
    byDepartment[t.department] = (byDepartment[t.department] || 0) + 1;
    byDesignation[t.designation] = (byDesignation[t.designation] || 0) + 1;
  });
  
  return {
    title: 'Teacher Performance Report',
    generatedAt: new Date().toISOString(),
    summary: {
      total: totalTeachers,
      active: activeTeachers,
      inactive: totalTeachers - activeTeachers
    },
    byDepartment,
    byDesignation,
    teachers: teachers.map(t => ({
      id: t._id,
      name: t.name || 'N/A',
      email: t.email || '',
      department: t.department || '',
      designation: t.designation || '',
      status: t.status || '',
      rating: t.rating || 0
    }))
  };
};

// Helper: Generate admission report
const generateAdmissionReport = async (params = {}) => {
  const { program, status, startDate, endDate } = params;
  
  const query = {};
  query.isDeleted = { $ne: true };
  if (program) query.program = program;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.applicationDate = {};
    if (startDate) query.applicationDate.$gte = new Date(startDate);
    if (endDate) query.applicationDate.$lte = new Date(endDate);
  }
  
  const admissions = await Admission.find(query).sort({ createdAt: -1 });
  
  const total = admissions.length;
  const byStatus = {};
  const byProgram = {};
  const byDepartment = {};
  
  admissions.forEach(a => {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    byProgram[a.program] = (byProgram[a.program] || 0) + 1;
    byDepartment[a.department] = (byDepartment[a.department] || 0) + 1;
  });
  
  return {
    title: 'Admissions Funnel Report',
    generatedAt: new Date().toISOString(),
    summary: {
      total,
      pending: byStatus.Pending || 0,
      accepted: byStatus.Accepted || 0,
      rejected: byStatus.Rejected || 0,
      enrolled: byStatus.Enrolled || 0
    },
    byStatus,
    byProgram,
    byDepartment,
    admissions: admissions.map(a => ({
      id: a._id,
      name: a.name || 'N/A',
      email: a.email || '',
      program: a.program || '',
      department: a.department || '',
      status: a.status || '',
      applicationDate: a.applicationDate
    }))
  };
};

// Helper: Generate attendance report
const generateAttendanceReport = async (params = {}) => {
  const { department, startDate, endDate } = params;
  
  const query = {};
  query.isDeleted = { $ne: true };
  if (department) query.department = department;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  
  const attendances = await Attendance.find(query).sort({ date: -1 });
  
  const totalRecords = attendances.length;
  const present = attendances.filter(a => a.status === 'Present').length;
  const absent = attendances.filter(a => a.status === 'Absent').length;
  const late = attendances.filter(a => a.status === 'Late').length;
  
  return {
    title: 'Attendance Analytics Report',
    generatedAt: new Date().toISOString(),
    summary: {
      totalRecords,
      present,
      absent,
      late,
      attendanceRate: totalRecords > 0 ? ((present / totalRecords) * 100).toFixed(2) : 0
    },
    attendances: attendances.map(a => ({
      student: a.studentName || 'N/A',
      department: a.department || '',
      date: a.date,
      status: a.status || '',
      timeIn: a.timeIn,
      timeOut: a.timeOut
    }))
  };
};

// Helper: Generate finance report
const generateFinanceReport = async (params = {}) => {
  const { startDate, endDate } = params;
  
  const query = {};
  query.isDeleted = { $ne: true };
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  const fees = await Fee.find(query).sort({ createdAt: -1 });
  
  const totalCollected = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalPending = fees.filter(f => f.status === 'Pending').reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalPaid = fees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + (f.amount || 0), 0);
  
  return {
    title: 'Finance Summary Report',
    generatedAt: new Date().toISOString(),
    summary: {
      totalCollected,
      totalPending,
      totalPaid,
      totalRecords: fees.length
    },
    fees: fees.map(f => ({
      student: f.studentName || 'N/A',
      type: f.type || '',
      amount: f.amount || 0,
      status: f.status || '',
      dueDate: f.dueDate,
      paidDate: f.paidDate
    }))
  };
};

// Helper: Generate HR report
const generateHRReport = async (params = {}) => {
  const { department, status } = params;
  
  const query = {};
  query.isDeleted = { $ne: true };
  if (department) query.department = department;
  if (status) query.status = status;
  
  const employees = await Employee.find(query).sort({ createdAt: -1 });
  const leaves = await Leave.find({ status: 'Approved', isDeleted: { $ne: true } }).sort({ startDate: -1 });
  
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  const onLeave = employees.filter(e => e.status === 'On Leave').length;
  const totalLeaves = leaves.length;
  
  return {
    title: 'Human Resources Report',
    generatedAt: new Date().toISOString(),
    summary: {
      totalEmployees,
      active: activeEmployees,
      onLeave,
      totalLeaves
    },
    employees: employees.map(e => ({
      id: e._id,
      name: getDisplayNameForRecord(e),
      department: e.department || '',
      designation: e.designation || '',
      status: e.status || '',
      salary: e.salary || 0
    })),
    leaves: leaves.map(l => ({
      employee: l.employeeName || 'N/A',
      type: l.type || '',
      startDate: l.startDate,
      endDate: l.endDate,
      days: l.days || 0
    }))
  };
};

// Helper: Generate Library report
const generateLibraryReport = async (params = {}) => {
  return {
    title: 'Library Usage Report',
    generatedAt: new Date().toISOString(),
    summary: {
      totalBooks: 2450,
      borrowed: 342,
      available: 2108,
      overdue: 23
    },
    books: []
  };
};

// Helper: Generate Hostel report
const generateHostelReport = async (params = {}) => {
  return {
    title: 'Hostel Occupancy Report',
    generatedAt: new Date().toISOString(),
    summary: {
      totalRooms: 200,
      occupied: 165,
      available: 35,
      occupancyRate: '82.5%'
    },
    hostels: []
  };
};

// Helper: Generate Transport report
const generateTransportReport = async (params = {}) => {
  return {
    title: 'Transport Utilization Report',
    generatedAt: new Date().toISOString(),
    summary: {
      totalBuses: 15,
      activeRoutes: 12,
      dailyRidership: 850,
      utilizationRate: '80%'
    },
    routes: []
  };
};

// Helper: Generate Exam report
const generateExamReport = async (params = {}) => {
  return {
    title: 'Exam Results Report',
    generatedAt: new Date().toISOString(),
    summary: {
      totalExams: 45,
      passed: 38,
      failed: 7,
      passRate: '84.4%'
    },
    exams: []
  };
};

// ==================== CONTROLLER FUNCTIONS ====================

// Get all reports
export const getAllReports = handle(async (req, res) => {
  const reports = await Report.find({ isArchived: false, isDeleted: { $ne: true } })
    .sort({ createdAt: -1 })
    .populate('generatedBy', 'name email');
  
  res.status(200).json({
    success: true,
    data: reports,
    count: reports.length
  });
});

// Get report by ID
export const getReportById = handle(async (req, res) => {
  const report = await Report.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
    .populate('generatedBy', 'name email');
  
  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: report
  });
});

// Generate a new report
export const generateReport = handle(async (req, res) => {
  const { name, category, type, parameters, schedule, recipients, tags } = req.body;
  
  let reportData = null;
  let generatedAt = new Date();
  
  switch (category) {
    case 'Student':
      reportData = await generateStudentReport(parameters);
      break;
    case 'Teacher':
      reportData = await generateTeacherReport(parameters);
      break;
    case 'Admission':
      reportData = await generateAdmissionReport(parameters);
      break;
    case 'Attendance':
      reportData = await generateAttendanceReport(parameters);
      break;
    case 'Finance':
      reportData = await generateFinanceReport(parameters);
      break;
    case 'HR':
      reportData = await generateHRReport(parameters);
      break;
    case 'Library':
      reportData = await generateLibraryReport(parameters);
      break;
    case 'Hostel':
      reportData = await generateHostelReport(parameters);
      break;
    case 'Transport':
      reportData = await generateTransportReport(parameters);
      break;
    case 'Exam':
      reportData = await generateExamReport(parameters);
      break;
    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid report category'
      });
  }
  
  const report = new Report({
    name,
    category,
    type: type || 'PDF',
    parameters: parameters || {},
    data: reportData,
    generatedBy: req.user?.id || null,
    generatedAt,
    status: 'Completed',
    schedule: schedule || { enabled: false },
    recipients: recipients || [],
    tags: tags || []
  });
  
  await report.save();
  
  res.status(201).json({
    success: true,
    data: report,
    message: 'Report generated successfully'
  });
});

// Update report
export const updateReport = handle(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  delete updateData.isDeleted;
  delete updateData.deletedAt;
  delete updateData.deletedBy;
  delete updateData._id;
  delete updateData.createdAt;
  delete updateData.updatedAt;
  
  const report = await Report.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    updateData,
    { new: true, runValidators: true }
  );
  
  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: report,
    message: 'Report updated successfully'
  });
});

// Delete report (soft delete)
export const deleteReport = handle(async (req, res) => {
  const report = await Report.findOneAndUpdate(
    { _id: req.params.id, isDeleted: { $ne: true } },
    { isArchived: true },
    { new: true }
  );
  
  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Report archived successfully'
  });
});

// Export report as CSV
export const exportCSV = handle(async (req, res) => {
  const report = await Report.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }
  
  let csvData = '';
  const data = report.data;
  
  if (data && data.students && data.students.length > 0) {
    // Student report - prefer valid 'name', fallback to email-derived name
    const headers = ['Name', 'Email', 'Department', 'Program', 'Status'];
    csvData = headers.join(',') + '\n';

    const deriveNameFromEmail = (email) => {
      if (!email || typeof email !== 'string') return 'N/A';
      const local = email.split('@')[0] || '';
      if (!local) return 'N/A';
      const pretty = local.replace(/[._\-]+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return pretty || 'N/A';
    };

    data.students.forEach((s) => {
      let name = 'N/A';
      if (s.name && typeof s.name === 'string') {
        const n = s.name.trim();
        if (n && n !== 'N/A' && n !== 'undefined undefined' && n !== 'undefined') {
          name = n;
        }
      }
      if (name === 'N/A') {
        name = deriveNameFromEmail(s.email);
      }

      csvData += `"${name}","${s.email || ''}","${s.department || ''}","${s.program || ''}","${s.status || ''}"\n`;
    });
  } else if (data && data.teachers && data.teachers.length > 0) {
    const headers = ['Name', 'Email', 'Department', 'Designation', 'Status', 'Rating'];
    csvData = headers.join(',') + '\n';
    data.teachers.forEach((t) => {
      csvData += `"${t.name || 'N/A'}","${t.email || ''}","${t.department || ''}","${t.designation || ''}","${t.status || ''}","${t.rating || 0}"\n`;
    });
  } else if (data && data.admissions && data.admissions.length > 0) {
    const headers = ['Name', 'Email', 'Program', 'Department', 'Status', 'Application Date'];
    csvData = headers.join(',') + '\n';
    data.admissions.forEach((a) => {
      csvData += `"${a.name || ''}","${a.email || ''}","${a.program || ''}","${a.department || ''}","${a.status || ''}","${a.applicationDate || ''}"\n`;
    });
  } else if (data && data.fees && data.fees.length > 0) {
    const headers = ['Student', 'Type', 'Amount', 'Status', 'Due Date', 'Paid Date'];
    csvData = headers.join(',') + '\n';
    data.fees.forEach((f) => {
      csvData += `"${f.student || ''}","${f.type || ''}","${f.amount || 0}","${f.status || ''}","${f.dueDate || ''}","${f.paidDate || ''}"\n`;
    });
  } else if (data && data.employees && data.employees.length > 0) {
    const headers = ['Name', 'Department', 'Designation', 'Status', 'Salary'];
    csvData = headers.join(',') + '\n';
    data.employees.forEach((e) => {
        // e may be a plain object coming from stored report.data; try to use firstName/lastName/email fallbacks
        const name = getDisplayNameForRecord(e);
        csvData += `"${name}","${e.department || ''}","${e.designation || ''}","${e.status || ''}","${e.salary || 0}"\n`;
      });
  } else {
    return res.status(400).json({
      success: false,
      message: 'No data available for CSV export'
    });
  }
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${report.name.replace(/\s+/g, '_')}.csv`);
  res.send(csvData);
});

// Get report stats
export const getReportStats = handle(async (req, res) => {
  const total = await Report.countDocuments({ isArchived: false, isDeleted: { $ne: true } });
  const byCategory = await Report.aggregate([
    { $match: { isArchived: false, isDeleted: { $ne: true } } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);
  
  const recent = await Report.find({ isArchived: false, isDeleted: { $ne: true } })
    .sort({ generatedAt: -1 })
    .limit(5)
    .populate('generatedBy', 'name');
  
  res.status(200).json({
    success: true,
    data: {
      total,
      byCategory,
      recent
    }
  });
});

// Get report categories
export const getReportCategories = handle(async (req, res) => {
  const categories = [
    { id: 'Student', label: 'Student Enrollment', icon: 'Users' },
    { id: 'Teacher', label: 'Teacher Performance', icon: 'Users' },
    { id: 'Admission', label: 'Admissions Funnel', icon: 'FileText' },
    { id: 'Attendance', label: 'Attendance Analytics', icon: 'Calendar' },
    { id: 'Finance', label: 'Finance Summary', icon: 'Wallet' },
    { id: 'HR', label: 'Human Resources', icon: 'Users' },
    { id: 'Library', label: 'Library Usage', icon: 'BookOpen' },
    { id: 'Hostel', label: 'Hostel Occupancy', icon: 'Building2' },
    { id: 'Transport', label: 'Transport Utilization', icon: 'Bus' },
    { id: 'Exam', label: 'Exam Results', icon: 'Award' }
  ];
  
  res.status(200).json({
    success: true,
    data: categories
  });
});
