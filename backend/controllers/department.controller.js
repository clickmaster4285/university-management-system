import mongoose from 'mongoose';
import { handle } from "../utils/asyncHandler.js";
import { Department, Course, Teacher, Faculty } from '../models/index.js';
import { generateDepartmentId } from "../utils/generateDepartmentId.js";

async function findDepartmentByIdentifier(identifier) {
  const query = [{ departmentId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return Department.findOne({ $or: query, isDeleted: { $ne: true } });
}

export const getDepartments = handle(async (req, res) => {
  const { campusId, isActive } = req.query;
  const filter = { isDeleted: { $ne: true } };
  if (campusId) filter.campusId = campusId;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const departments = await Department.find(filter)
    .sort({ name: 1 })
    .populate('campusId', 'name campusCode')
    .populate('facultyId', 'name code')
    .populate('headId', 'name email designation')
    .select('-__v');

  res.json({
    success: true,
    count: departments.length,
    data: departments
  });
});

export const getDepartmentById = handle(async (req, res) => {
  const department = await findDepartmentByIdentifier(req.params.id);

  if (!department) {
    return res.status(404).json({
      success: false,
      message: 'Department not found'
    });
  }

  const populated = await Department.findById(department._id)
    .populate('campusId', 'name campusCode')
    .populate('facultyId', 'name code')
    .populate('headId', 'name email designation');

  res.json({ success: true, data: populated });
});

export const createDepartment = handle(async (req, res) => {
  const {
    campusId,
    name,
    code,
    description,
    headId,
    facultyId,
    email,
    phone,
    establishedDate,
    facultyCount,
    studentCount,
    status,
    location
  } = req.body;

  if (!campusId || !name || !code) {
    return res.status(400).json({
      success: false,
      message: 'campusId, name and code are required'
    });
  }

  // Verify campus exists
  const campus = await mongoose.model('Campus').findOne({ _id: campusId, isDeleted: { $ne: true } });
  if (!campus) {
    return res.status(400).json({
      success: false,
      message: `Campus ${campusId} not found`
    });
  }

  // Check for duplicate name/code within the same campus
  const existing = await Department.findOne({
    campusId,
    $or: [{ name: name.trim() }, { code: code.toUpperCase().trim() }],
    isDeleted: { $ne: true }
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'Department with this name or code already exists in this campus'
    });
  }

  // Verify headId if provided
  if (headId) {
    const head = await Teacher.findOne({ _id: headId, isDeleted: { $ne: true } });
    if (!head) {
      return res.status(400).json({
        success: false,
        message: `Teacher ${headId} not found`
      });
    }
  }

  // Verify facultyId if provided
  if (facultyId) {
    const faculty = await Faculty.findOne({ _id: facultyId, isDeleted: { $ne: true } });
    if (!faculty) {
      return res.status(400).json({
        success: false,
        message: `Faculty ${facultyId} not found`
      });
    }
  }

  const departmentId = await generateDepartmentId();

  const department = new Department({
    departmentId,
    campusId,
    name: name.trim(),
    code: code.toUpperCase().trim(),
    description: description || '',
    headId: headId || null,
    facultyId: facultyId || null,
    email: email || '',
    phone: phone || '',
    establishedDate: establishedDate ? new Date(establishedDate) : null,
    facultyCount: Number(facultyCount) || 0,
    studentCount: Number(studentCount) || 0,
    status: status || 'Active',
    location: location || ''
  });

  await department.save();

  const populated = await Department.findById(department._id)
    .populate('campusId', 'name campusCode')
    .populate('facultyId', 'name code')
    .populate('headId', 'name email designation');

  res.status(201).json({
    success: true,
    data: populated,
    message: 'Department created successfully'
  });
});

export const updateDepartment = handle(async (req, res) => {
  const { id } = req.params;
  const {
    campusId,
    name,
    code,
    description,
    status,
    headId,
    facultyId,
    email,
    phone,
    establishedDate,
    facultyCount,
    studentCount,
    location
  } = req.body;

  const department = await findDepartmentByIdentifier(id);
  if (!department) {
    return res.status(404).json({
      success: false,
      message: 'Department not found'
    });
  }

  if (name !== undefined && name !== '') {
    const trimmedName = name.trim();
    const existing = await Department.findOne({
      campusId: department.campusId,
      name: trimmedName,
      _id: { $ne: department._id },
      isDeleted: { $ne: true }
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Department name already exists in this campus'
      });
    }
    department.name = trimmedName;
  }

  if (code !== undefined && code !== '') {
    const trimmedCode = code.toUpperCase().trim();
    const existing = await Department.findOne({
      campusId: department.campusId,
      code: trimmedCode,
      _id: { $ne: department._id },
      isDeleted: { $ne: true }
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Department code already exists in this campus'
      });
    }
    department.code = trimmedCode;
  }

  if (description !== undefined) department.description = description;
  if (status !== undefined && status !== '') department.status = status;
  if (headId !== undefined) department.headId = headId || null;
  if (facultyId !== undefined) department.facultyId = facultyId || null;
  if (email !== undefined) department.email = email;
  if (phone !== undefined) department.phone = phone;
  if (establishedDate !== undefined) department.establishedDate = establishedDate ? new Date(establishedDate) : null;
  if (facultyCount !== undefined) department.facultyCount = Number(facultyCount) || 0;
  if (studentCount !== undefined) department.studentCount = Number(studentCount) || 0;
  if (location !== undefined) department.location = location;

  await department.save();

  const populated = await Department.findById(department._id)
    .populate('campusId', 'name campusCode')
    .populate('facultyId', 'name code')
    .populate('headId', 'name email designation');

  res.json({
    success: true,
    data: populated,
    message: 'Department updated successfully'
  });
});

export const deleteDepartment = handle(async (req, res) => {
  const { id } = req.params;

  const department = await findDepartmentByIdentifier(id);
  if (!department) {
    return res.status(404).json({
      success: false,
      message: 'Department not found'
    });
  }

  // Check for courses using this department
  const courseCount = await Course.countDocuments({ departmentId: department._id, isDeleted: { $ne: true } });
  if (courseCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete department with ${courseCount} courses. Remove courses first or deactivate the department.`,
      courseCount
    });
  }

  await department.deleteOne();

  res.json({
    success: true,
    message: 'Department deleted successfully'
  });
});

export const getDepartmentStats = handle(async (req, res) => {
  const stats = await Department.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    {
      $lookup: {
        from: 'courses',
        localField: '_id',
        foreignField: 'departmentId',
        as: 'courses'
      }
    },
    {
      $project: {
        name: 1,
        code: 1,
        campusId: 1,
        isActive: 1,
        courseCount: { $size: '$courses' },
        totalStudents: { $sum: '$courses.enrolledStudents' },
        totalCredits: { $sum: '$courses.credits' }
      }
    },
    { $sort: { courseCount: -1 } }
  ]);

  const totalDepartments = await Department.countDocuments({ isDeleted: { $ne: true } });
  const activeDepartments = await Department.countDocuments({ isActive: true, isDeleted: { $ne: true } });

  res.json({
    success: true,
    data: {
      total: totalDepartments,
      active: activeDepartments,
      inactive: totalDepartments - activeDepartments,
      departments: stats
    }
  });
});
