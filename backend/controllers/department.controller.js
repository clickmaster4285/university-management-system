import mongoose from 'mongoose';
import { handle } from "../utils/asyncHandler.js";

import { Department } from '../models/index.js';
async function findDepartmentByIdentifier(identifier) {
  const query = [{ departmentId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return Department.findOne({ $or: query, isDeleted: { $ne: true } });
}

export const getDepartments = handle(async (req, res) => {
  const { isActive } = req.query;
  const filter = { isDeleted: { $ne: true } };
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const departments = await Department.find(filter)
    .sort({ name: 1 })
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

  res.json({ success: true, data: department });
});

export const createDepartment = handle(async (req, res) => {
  const {
    name,
    code,
    description,
    head,
    faculty,
    email,
    phone,
    establishedDate,
    facultyCount,
    studentCount,
    status,
    location
  } = req.body;

  if (!name || !code) {
    return res.status(400).json({
      success: false,
      message: 'Name and code are required'
    });
  }

  const existing = await Department.findOne({
    $or: [{ name: name.trim() }, { code: code.toUpperCase().trim() }],
    isDeleted: { $ne: true }
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'Department with this name or code already exists'
    });
  }

  const department = new Department({
    name: name.trim(),
    code: code.toUpperCase().trim(),
    description: description || '',
    head: head || '',
    faculty: faculty || '',
    email: email || '',
    phone: phone || '',
    establishedDate: establishedDate ? new Date(establishedDate) : null,
    facultyCount: Number(facultyCount) || 0,
    studentCount: Number(studentCount) || 0,
    status: status || 'Active',
    location: location || ''
  });

  await department.save();

  res.status(201).json({
    success: true,
    data: department,
    message: 'Department created successfully'
  });
});

export const updateDepartment = handle(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    code,
    description,
    status,
    head,
    faculty,
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
      name: trimmedName,
      _id: { $ne: department._id },
      isDeleted: { $ne: true }
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Department name already exists'
      });
    }
    department.name = trimmedName;
  }

  if (code !== undefined && code !== '') {
    const trimmedCode = code.toUpperCase().trim();
    const existing = await Department.findOne({
      code: trimmedCode,
      _id: { $ne: department._id },
      isDeleted: { $ne: true }
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Department code already exists'
      });
    }
    department.code = trimmedCode;
  }

  if (description !== undefined) {
    department.description = description;
  }

  if (status !== undefined && status !== '') {
    department.status = status;
  }

  if (head !== undefined) {
    department.head = head;
  }

  if (faculty !== undefined) {
    department.faculty = faculty;
  }

  if (email !== undefined) {
    department.email = email;
  }

  if (phone !== undefined) {
    department.phone = phone;
  }

  if (establishedDate !== undefined) {
    department.establishedDate = establishedDate ? new Date(establishedDate) : null;
  }

  if (facultyCount !== undefined) {
    department.facultyCount = Number(facultyCount) || 0;
  }

  if (studentCount !== undefined) {
    department.studentCount = Number(studentCount) || 0;
  }

  if (location !== undefined) {
    department.location = location;
  }

  await department.save();

  res.json({
    success: true,
    data: department,
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

  let Course;
  try {
    const module = await import('../models/Course.model.js');
    Course = module.default;
  } catch (err) {
    console.warn('Course model not found, skipping course check');
  }

  if (Course) {
    const courseCount = await Course.countDocuments({ departmentName: department.name });
    if (courseCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with ' + courseCount + ' courses. Remove courses first or deactivate the department.',
        courseCount: courseCount
      });
    }
  }

  await department.deleteOne();

  res.json({
    success: true,
    message: 'Department deleted successfully'
  });
});

export const getDepartmentStats = handle(async (req, res) => {
  let Course;
  try {
    const module = await import('../models/Course.model.js');
    Course = module.default;
  } catch (err) {
    console.warn('Course model not found, returning basic stats');
  }

  const stats = await Department.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    {
      $lookup: {
        from: 'courses',
        localField: 'name',
        foreignField: 'departmentName',
        as: 'courses'
      }
    },
    {
      $project: {
        name: 1,
        code: 1,
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
