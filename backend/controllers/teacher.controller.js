import { handle } from "../utils/asyncHandler.js";

import { Teacher } from "../models/index.js";
export const getTeachers = handle(async (req, res) => {
  const {
    department,
    designation,
    status,
    search,
    page = 1,
    limit = 10
  } = req.query;

  const filter = { isDeleted: { $ne: true } };
  if (department) filter.department = department;
  if (designation) filter.designation = designation;
  if (status) filter.status = status;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { specialization: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const teachers = await Teacher.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 })
    .select('-__v');

  const totalCount = await Teacher.countDocuments(filter);

  res.json({
    success: true,
    count: teachers.length,
    total: totalCount,
    page: parseInt(page),
    totalPages: Math.ceil(totalCount / parseInt(limit)),
    data: teachers
  });
});

export const getTeacherById = handle(async (req, res) => {
  const teacher = await Teacher.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
    .select('-__v');

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: `Teacher ${req.params.id} not found`
    });
  }

  res.json({ success: true, data: teacher });
});

export const createTeacher = handle(async (req, res) => {
  const { name, department, designation, email } = req.body;

  if (!name || !department || !designation) {
    return res.status(400).json({
      success: false,
      message: "name, department and designation are required fields",
    });
  }

  if (email) {
    const existingEmail = await Teacher.findOne({ email, isDeleted: { $ne: true } });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: `Teacher with email ${email} already exists`
      });
    }
  }

  const teacherData = {
    name,
    department,
    designation,
    email: email || "",
    phone: req.body.phone || "",
    specialization: req.body.specialization || "",
    experience: req.body.experience ?? 0,
    rating: req.body.rating ?? 0,
    salary: req.body.salary ?? 0,
    status: req.body.status ?? "Active",
    officeHours: req.body.officeHours || "",
    qualifications: req.body.qualifications || []
  };

  const teacher = new Teacher(teacherData);
  await teacher.save();

  res.status(201).json({
    success: true,
    data: teacher
  });
});

export const updateTeacher = handle(async (req, res) => {
  const { id } = req.params;

  const existingTeacher = await Teacher.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!existingTeacher) {
    return res.status(404).json({
      success: false,
      message: `Teacher ${id} not found`
    });
  }

  if (req.body.email) {
    const duplicateEmail = await Teacher.findOne({
      email: req.body.email,
      _id: { $ne: id },
      isDeleted: { $ne: true }
    });
    if (duplicateEmail) {
      return res.status(400).json({
        success: false,
        message: `Teacher with email ${req.body.email} already exists`
      });
    }
  }

  const { _id, isDeleted, deletedAt, deletedBy, createdAt, updatedAt, ...updateData } = req.body;

  const updatedTeacher = await Teacher.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  ).select('-__v');

  res.json({
    success: true,
    data: updatedTeacher
  });
});

export const deleteTeacher = handle(async (req, res) => {
  const { id } = req.params;

  const teacher = await Teacher.findByIdAndDelete(id);

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: `Teacher ${id} not found`
    });
  }

  res.json({
    success: true,
    message: "Teacher deleted successfully",
    data: teacher
  });
});

export const bulkCreateTeachers = handle(async (req, res) => {
  const teachers = req.body.teachers || req.body;

  if (!Array.isArray(teachers)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an array of teachers'
    });
  }

  if (teachers.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Teacher array cannot be empty'
    });
  }

  const invalidTeachers = teachers.filter(t => !t.name || !t.department || !t.designation);
  if (invalidTeachers.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Each teacher must have name, department and designation',
      invalidCount: invalidTeachers.length
    });
  }

  const createdTeachers = await Teacher.insertMany(teachers);

  res.status(201).json({
    success: true,
    count: createdTeachers.length,
    data: createdTeachers
  });
});

export const getTeacherStats = handle(async (req, res) => {
  const stats = await Teacher.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    {
      $group: {
        _id: null,
        totalTeachers: { $sum: 1 },
        averageExperience: { $avg: '$experience' },
        averageRating: { $avg: '$rating' },
        averageSalary: { $avg: '$salary' }
      }
    }
  ]);

  const deptStats = await Teacher.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        avgExperience: { $avg: '$experience' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const designationStats = await Teacher.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    {
      $group: {
        _id: '$designation',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const statusStats = await Teacher.aggregate([
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
        totalTeachers: 0,
        averageExperience: 0,
        averageRating: 0,
        averageSalary: 0
      },
      byDepartment: deptStats,
      byDesignation: designationStats,
      byStatus: statusStats
    }
  });
});
