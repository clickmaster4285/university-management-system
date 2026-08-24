import mongoose from 'mongoose';
import { handle } from "../utils/asyncHandler.js";
import { User, Teacher, Counter } from "../models/index.js";
import { generateTeacherId } from "../utils/generateTeacherId.js";

export const getTeachers = handle(async (req, res) => {
  const {
    departmentId,
    designation,
    status,
    search,
    page = 1,
    limit = 10
  } = req.query;

  const filter = { isDeleted: { $ne: true } };
  if (departmentId) filter.departmentId = departmentId;
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
    .populate('userId', 'firstName lastName email role status')
    .populate('departmentId', 'name code')
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
    .populate('userId', 'firstName lastName email role status')
    .populate('departmentId', 'name code')
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
  const {
    firstName,
    lastName,
    email,
    password,
    departmentId,
    designation,
    phone,
    specialization,
    experience,
    salary,
    officeHours,
    qualifications
  } = req.body;

  if (!firstName || !lastName || !email || !password || !departmentId || !designation) {
    return res.status(400).json({
      success: false,
      message: "firstName, lastName, email, password, departmentId and designation are required",
    });
  }

  // Check if user with this email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase().trim(), isDeleted: { $ne: true } });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: `User with email ${email} already exists`
    });
  }

  // Check if department exists
  const department = await mongoose.model('Department').findOne({ _id: departmentId, isDeleted: { $ne: true } });
  if (!department) {
    return res.status(400).json({
      success: false,
      message: `Department ${departmentId} not found`
    });
  }

  // Generate teacherId
  const teacherId = await generateTeacherId();

  // Create User account
  const user = new User({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: 'Teacher',
    status: 'Active'
  });
  await user.save();

  // Create Teacher profile
  const teacher = new Teacher({
    teacherId,
    userId: user._id,
    name: `${firstName.trim()} ${lastName.trim()}`,
    email: email.toLowerCase().trim(),
    phone: phone || "",
    departmentId,
    designation,
    specialization: specialization || "",
    experience: experience ?? 0,
    salary: salary ?? 0,
    officeHours: officeHours || "",
    qualifications: qualifications || []
  });
  await teacher.save();

  res.status(201).json({
    success: true,
    data: {
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status
      },
      teacher: {
        _id: teacher._id,
        teacherId: teacher.teacherId,
        name: teacher.name,
        email: teacher.email,
        departmentId: teacher.departmentId,
        designation: teacher.designation
      }
    },
    message: 'Teacher and User account created successfully'
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

  const { _id, isDeleted, deletedAt, deletedBy, createdAt, updatedAt, userId, teacherId, ...updateData } = req.body;

  const updatedTeacher = await Teacher.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  )
    .populate('userId', 'firstName lastName email role status')
    .populate('departmentId', 'name code')
    .select('-__v');

  res.json({
    success: true,
    data: updatedTeacher
  });
});

export const deleteTeacher = handle(async (req, res) => {
  const { id } = req.params;

  const teacher = await Teacher.findById(id);
  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: `Teacher ${id} not found`
    });
  }

  // Soft-delete teacher
  teacher.isDeleted = true;
  teacher.deletedAt = new Date();
  teacher.deletedBy = req.user._id;
  await teacher.save();

  // Also soft-delete linked user
  if (teacher.userId) {
    await User.findByIdAndUpdate(teacher.userId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.user._id
    });
  }

  res.json({
    success: true,
    message: "Teacher deleted successfully",
    data: teacher
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
        _id: '$departmentId',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        avgExperience: { $avg: '$experience' }
      }
    },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: '_id',
        as: 'department'
      }
    },
    { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        count: 1,
        avgRating: 1,
        avgExperience: 1,
        departmentName: '$department.name',
        departmentCode: '$department.code'
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
