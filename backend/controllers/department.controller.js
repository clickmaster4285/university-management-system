import mongoose from 'mongoose';
import { handle } from "../utils/asyncHandler.js";
import { Department, Course, Teacher, Faculty, Program, Batch } from '../models/index.js';
import { generateDepartmentId } from "../utils/generateDepartmentId.js";

async function findDepartmentByIdentifier(identifier) {
  const query = [{ departmentId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return Department.findOne({ $or: query, isDeleted: { $ne: true } });
}

async function validateTeacherRef(headId) {
  if (!headId) return null;
  const head = await Teacher.findOne({ _id: headId, isDeleted: { $ne: true } });
  if (!head) {
    return { message: `Teacher ${headId} not found` };
  }
  return null;
}

async function validateFacultyForCampus(facultyId, campusId) {
  if (!facultyId) return null;
  const faculty = await Faculty.findOne({ _id: facultyId, isDeleted: { $ne: true } });
  if (!faculty) {
    return { message: `Faculty ${facultyId} not found` };
  }
  if (faculty.campusId.toString() !== campusId.toString()) {
    return { message: 'Faculty must belong to the same campus as the department' };
  }
  return null;
}

function findDuplicateDepartment({ campusId, name, code, excludeId }) {
  const filter = {
    campusId,
    $or: [{ name: name.trim() }, { code: code.toUpperCase().trim() }],
  };
  if (excludeId) filter._id = { $ne: excludeId };
  return Department.findOne(filter);
}

export const getDepartments = handle(async (req, res) => {
  const { campusId, facultyId, status, search, page = 1, limit = 100 } = req.query;
  const filter = { isDeleted: { $ne: true } };

  if (campusId) filter.campusId = campusId;
  if (facultyId) filter.facultyId = facultyId;
  if (status) filter.status = status;

  // Backward compatibility for older clients
  if (req.query.isActive !== undefined && !status) {
    filter.status = req.query.isActive === 'true' ? 'Active' : 'Inactive';
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { departmentId: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const departments = await Department.find(filter)
    .skip(skip)
    .limit(parseInt(limit, 10))
    .sort({ name: 1 })
    .populate('campusId', 'name campusCode')
    .populate('facultyId', 'name code')
    .populate('headId', 'name email designation')
    .select('-__v');

  const totalCount = await Department.countDocuments(filter);

  res.json({
    success: true,
    count: departments.length,
    total: totalCount,
    page: parseInt(page, 10),
    totalPages: Math.ceil(totalCount / parseInt(limit, 10)),
    data: departments,
  });
});

export const getDepartmentById = handle(async (req, res) => {
  const department = await findDepartmentByIdentifier(req.params.id);

  if (!department) {
    return res.status(404).json({
      success: false,
      message: 'Department not found',
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
    status,
    location,
  } = req.body;

  if (!campusId || !name || !code) {
    return res.status(400).json({
      success: false,
      message: 'campusId, name and code are required',
    });
  }

  const campus = await mongoose.model('Campus').findOne({ _id: campusId, isDeleted: { $ne: true } });
  if (!campus) {
    return res.status(400).json({
      success: false,
      message: `Campus ${campusId} not found`,
    });
  }

  const duplicate = await findDuplicateDepartment({ campusId, name, code });
  if (duplicate) {
    const message = duplicate.isDeleted
      ? 'A department with this name or code was previously deleted. Use a different name or code.'
      : 'Department with this name or code already exists in this campus';
    return res.status(duplicate.isDeleted ? 409 : 400).json({ success: false, message });
  }

  const headError = await validateTeacherRef(headId);
  if (headError) {
    return res.status(400).json({ success: false, message: headError.message });
  }

  const facultyError = await validateFacultyForCampus(facultyId, campusId);
  if (facultyError) {
    return res.status(400).json({ success: false, message: facultyError.message });
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
    status: status || 'Active',
    location: location || '',
  });

  await department.save();

  const populated = await Department.findById(department._id)
    .populate('campusId', 'name campusCode')
    .populate('facultyId', 'name code')
    .populate('headId', 'name email designation');

  res.status(201).json({
    success: true,
    data: populated,
    message: 'Department created successfully',
  });
});

export const updateDepartment = handle(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    code,
    description,
    status,
    headId,
    facultyId,
    email,
    phone,
    establishedDate,
    location,
  } = req.body;

  const department = await findDepartmentByIdentifier(id);
  if (!department) {
    return res.status(404).json({
      success: false,
      message: 'Department not found',
    });
  }

  if (name !== undefined && name !== '') {
    const trimmedName = name.trim();
    const existing = await Department.findOne({
      campusId: department.campusId,
      name: trimmedName,
      _id: { $ne: department._id },
      isDeleted: { $ne: true },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Department name already exists in this campus',
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
      isDeleted: { $ne: true },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Department code already exists in this campus',
      });
    }
    department.code = trimmedCode;
  }

  if (headId !== undefined) {
    const headError = await validateTeacherRef(headId);
    if (headError) {
      return res.status(400).json({ success: false, message: headError.message });
    }
    department.headId = headId || null;
  }

  if (facultyId !== undefined) {
    const facultyError = await validateFacultyForCampus(facultyId, department.campusId);
    if (facultyError) {
      return res.status(400).json({ success: false, message: facultyError.message });
    }
    department.facultyId = facultyId || null;
  }

  if (description !== undefined) department.description = description;
  if (status !== undefined && status !== '') department.status = status;
  if (email !== undefined) department.email = email;
  if (phone !== undefined) department.phone = phone;
  if (establishedDate !== undefined) {
    department.establishedDate = establishedDate ? new Date(establishedDate) : null;
  }
  if (location !== undefined) department.location = location;

  await department.save();

  const populated = await Department.findById(department._id)
    .populate('campusId', 'name campusCode')
    .populate('facultyId', 'name code')
    .populate('headId', 'name email designation');

  res.json({
    success: true,
    data: populated,
    message: 'Department updated successfully',
  });
});

export const deleteDepartment = handle(async (req, res) => {
  const { id } = req.params;

  const department = await findDepartmentByIdentifier(id);
  if (!department) {
    return res.status(404).json({
      success: false,
      message: 'Department not found',
    });
  }

  const deptFilter = { departmentId: department._id, isDeleted: { $ne: true } };

  const [programCount, courseCount, teacherCount, batchCount] = await Promise.all([
    Program.countDocuments(deptFilter),
    Course.countDocuments(deptFilter),
    Teacher.countDocuments(deptFilter),
    Batch.countDocuments(deptFilter),
  ]);

  if (programCount > 0 || courseCount > 0 || teacherCount > 0 || batchCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete department while programs, courses, teachers, or batches are still linked. Remove or reassign them first, or deactivate the department.',
      programCount,
      courseCount,
      teacherCount,
      batchCount,
    });
  }

  const now = new Date();
  const deletedBy = req.user?._id || null;

  await department.updateOne({
    isDeleted: true,
    deletedAt: now,
    deletedBy,
  });

  res.json({
    success: true,
    message: 'Department deleted successfully',
  });
});

export const getDepartmentStats = handle(async (req, res) => {
  const notDeleted = { $ne: true };

  const stats = await Department.aggregate([
    { $match: { isDeleted: notDeleted } },
    {
      $lookup: {
        from: 'courses',
        let: { deptId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$departmentId', '$$deptId'] }, isDeleted: notDeleted } },
        ],
        as: 'courses',
      },
    },
    {
      $lookup: {
        from: 'programs',
        let: { deptId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$departmentId', '$$deptId'] }, isDeleted: notDeleted } },
        ],
        as: 'programs',
      },
    },
    {
      $lookup: {
        from: 'teachers',
        let: { deptId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$departmentId', '$$deptId'] }, isDeleted: notDeleted } },
        ],
        as: 'teachers',
      },
    },
    {
      $project: {
        name: 1,
        code: 1,
        campusId: 1,
        status: 1,
        courseCount: { $size: '$courses' },
        programCount: { $size: '$programs' },
        teacherCount: { $size: '$teachers' },
        totalStudents: { $sum: '$courses.enrolledStudents' },
        totalCredits: { $sum: '$courses.credits' },
      },
    },
    { $sort: { courseCount: -1 } },
  ]);

  const totalDepartments = await Department.countDocuments({ isDeleted: notDeleted });
  const activeDepartments = await Department.countDocuments({ status: 'Active', isDeleted: notDeleted });

  res.json({
    success: true,
    data: {
      total: totalDepartments,
      active: activeDepartments,
      inactive: totalDepartments - activeDepartments,
      departments: stats,
    },
  });
});
