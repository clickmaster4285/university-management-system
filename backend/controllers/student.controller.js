import { handle } from "../utils/asyncHandler.js";

import { Student } from "../models/index.js";
export const getStudents = handle(async (req, res) => {
  const { program, department, status, search, page = 1, limit = 10 } = req.query;

  const filter = { isDeleted: { $ne: true } };
  if (program) filter.program = program;
  if (department) filter.department = department;
  if (status) filter.status = status;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const students = await Student.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 })
    .select('-__v');

  const totalCount = await Student.countDocuments(filter);

  res.json({
    success: true,
    count: students.length,
    total: totalCount,
    page: parseInt(page),
    totalPages: Math.ceil(totalCount / parseInt(limit)),
    data: students
  });
});

export const getStudentById = handle(async (req, res) => {
  const student = await Student.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).select('-__v');

  if (!student) {
    return res.status(404).json({
      success: false,
      message: `Student ${req.params.id} not found`
    });
  }

  res.json({ success: true, data: student });
});

export const createStudent = handle(async (req, res) => {
  const { name, program, department, email, cnic } = req.body;

  if (!name || !program || !department) {
    return res.status(400).json({
      success: false,
      message: "name, program and department are required fields",
    });
  }

  if (email) {
    const existingEmail = await Student.findOne({ email, isDeleted: { $ne: true } });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: `Student with email ${email} already exists`
      });
    }
  }

  if (cnic) {
    const existingCnic = await Student.findOne({ cnic, isDeleted: { $ne: true } });
    if (existingCnic) {
      return res.status(400).json({
        success: false,
        message: `Student with CNIC ${cnic} already exists`
      });
    }
  }

  const studentData = {
    name,
    program,
    department,
    semester: req.body.semester ?? 1,
    gpa: req.body.gpa ?? 0,
    cgpa: req.body.cgpa ?? 0,
    attendance: req.body.attendance ?? 0,
    fee: req.body.fee ?? "Pending",
    city: req.body.city ?? "",
    campus: req.body.campus ?? "",
    status: req.body.status ?? "Active",
    email: email ?? "",
    phone: req.body.phone ?? "",
    fatherName: req.body.fatherName ?? "",
    motherName: req.body.motherName ?? "",
    cnic: cnic ?? "",
  };

  const student = new Student(studentData);
  await student.save();

  res.status(201).json({
    success: true,
    data: student
  });
});

export const updateStudent = handle(async (req, res) => {
  const { id } = req.params;

  const existingStudent = await Student.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!existingStudent) {
    return res.status(404).json({
      success: false,
      message: `Student ${id} not found`
    });
  }

  if (req.body.email) {
    const duplicateEmail = await Student.findOne({
      email: req.body.email,
      _id: { $ne: id },
      isDeleted: { $ne: true }
    });
    if (duplicateEmail) {
      return res.status(400).json({
        success: false,
        message: `Student with email ${req.body.email} already exists`
      });
    }
  }

  if (req.body.cnic) {
    const duplicateCnic = await Student.findOne({
      cnic: req.body.cnic,
      _id: { $ne: id },
      isDeleted: { $ne: true }
    });
    if (duplicateCnic) {
      return res.status(400).json({
        success: false,
        message: `Student with CNIC ${req.body.cnic} already exists`
      });
    }
  }

  const { id: _, isDeleted, deletedAt, deletedBy, _id, createdAt, updatedAt, ...updateData } = req.body;

  const updatedStudent = await Student.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  ).select('-__v');

  res.json({
    success: true,
    data: updatedStudent
  });
});

export const deleteStudent = handle(async (req, res) => {
  const { id } = req.params;

  const student = await Student.findByIdAndDelete(id);

  if (!student) {
    return res.status(404).json({
      success: false,
      message: `Student ${id} not found`
    });
  }

  res.json({
    success: true,
    message: "Student deleted successfully",
    data: student
  });
});

export const bulkCreateStudents = handle(async (req, res) => {
  const students = req.body.students || req.body;

  if (!Array.isArray(students)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an array of students'
    });
  }

  if (students.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Student array cannot be empty'
    });
  }

  const invalidStudents = students.filter(s => !s.name || !s.program || !s.department);
  if (invalidStudents.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Each student must have name, program and department',
      invalidCount: invalidStudents.length
    });
  }

  const createdStudents = await Student.insertMany(students);

  res.status(201).json({
    success: true,
    count: createdStudents.length,
    data: createdStudents
  });
});

export const getStudentStats = handle(async (req, res) => {
  const stats = await Student.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    {
      $group: {
        _id: null,
        totalStudents: { $sum: 1 },
        averageGPA: { $avg: '$gpa' },
        averageAttendance: { $avg: '$attendance' },
        paidFee: {
          $sum: { $cond: [{ $eq: ['$fee', 'Paid'] }, 1, 0] }
        },
        pendingFee: {
          $sum: { $cond: [{ $eq: ['$fee', 'Pending'] }, 1, 0] }
        }
      }
    }
  ]);

  const programStats = await Student.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    {
      $group: {
        _id: '$program',
        count: { $sum: 1 },
        avgGPA: { $avg: '$gpa' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const statusStats = await Student.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.json({
    success: true,
    data: {
      overall: stats[0] || {
        totalStudents: 0,
        averageGPA: 0,
        averageAttendance: 0,
        paidFee: 0,
        pendingFee: 0
      },
      byProgram: programStats,
      byStatus: statusStats
    }
  });
});
