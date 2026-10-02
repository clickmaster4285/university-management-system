import mongoose from 'mongoose';
import { handle } from "../utils/asyncHandler.js";
import { Department, Subject, StaffMember, Faculty, Program, Batch, CourseOffering } from '../models/index.js';
import { generateDepartmentId } from "../utils/generateDepartmentId.js";

async function findDepartmentByIdentifier(identifier) {
  const query = [{ departmentId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return Department.findOne({ $or: query, isDeleted: { $ne: true } });
}

async function validateStaffHeadRef(headId) {
  if (!headId) return null;
  const head = await StaffMember.findOne({ _id: headId, isDeleted: { $ne: true } });
  if (!head) {
    return { message: `Staff member ${headId} not found` };
  }
  return null;
}

async function validateCampusAssignments(assignments) {
  if (!assignments || assignments.length === 0) return null;
  for (const a of assignments) {
    if (a.headId) {
      const err = await validateStaffHeadRef(a.headId);
      if (err) return { message: `Head not found for campus ${a.campus}: ${err.message}` };
    }
  }
  return null;
}

function syncCampusAssignments(existing, campusIds) {
  const existingMap = new Map();
  for (const a of existing) {
    const cid = a.campus?.toString?.();
    if (cid) existingMap.set(cid, a);
  }
  return campusIds.map((cid) => {
    const prev = existingMap.get(cid.toString());
    if (prev) {
      return {
        campus: prev.campus,
        headId: prev.headId || null,
        email: prev.email || '',
        phone: prev.phone || '',
        location: prev.location || '',
        establishedDate: prev.establishedDate || null,
        status: prev.status || 'Active',
      };
    }
    return { campus: cid, headId: null, email: '', phone: '', location: '', establishedDate: null, status: 'Active' };
  });
}

async function validateFacultiesExist(facultyIds) {
  if (!facultyIds || facultyIds.length === 0) return null;
  const valid = await Faculty.countDocuments({ _id: { $in: facultyIds }, isDeleted: { $ne: true } });
  if (valid !== facultyIds.length) {
    return { message: 'One or more selected faculties were not found' };
  }
  return null;
}

async function validateCampusesExist(campusIds) {
  if (!campusIds || campusIds.length === 0) return null;
  const valid = await mongoose.model('Campus').countDocuments({ _id: { $in: campusIds }, isDeleted: { $ne: true } });
  if (valid !== campusIds.length) {
    return { message: 'One or more selected campuses were not found' };
  }
  return null;
}

async function findDuplicateDepartment({ campusIds, name, code, excludeId }) {
  const codeCheck = await Department.findOne({
    code: code.toUpperCase().trim(),
    isDeleted: { $ne: true },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });
  if (codeCheck) return codeCheck;

  if (campusIds.length > 0) {
    const nameCheck = await Department.findOne({
      name: name.trim(),
      campusIds: { $in: campusIds },
      isDeleted: { $ne: true },
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
    if (nameCheck) return nameCheck;
  }

  return null;
}

const POPULATE_OPTS = [
  { path: 'campusIds', select: 'name campusCode' },
  { path: 'facultyIds', select: 'name code' },
  { path: 'campusAssignments.campus', select: 'name campusCode' },
  { path: 'campusAssignments.headId', select: 'staffId firstName lastName email' },
];

function populateDepartment(q) {
  let result = q;
  for (const opt of POPULATE_OPTS) {
    result = result.populate(opt);
  }
  return result;
}

export const getDepartments = handle(async (req, res) => {
  const { campusId, facultyId, search, page = 1, limit = 100 } = req.query;
  const filter = { isDeleted: { $ne: true } };

  if (campusId) {
    filter.$or = [{ campusIds: campusId }, { 'campusAssignments.campus': campusId }];
  }
  if (facultyId) {
    filter.facultyIds = facultyId;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { departmentId: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  let query = Department.find(filter)
    .skip(skip)
    .limit(parseInt(limit, 10))
    .sort({ name: 1 })
    .select('-__v');
  query = populateDepartment(query);
  const departments = await query;

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

  let q = Department.findById(department._id);
  const populated = await populateDepartment(q);

  const did = department._id;
  const nd = { isDeleted: { $ne: true } };

  const [totalPrograms, totalSubjects, totalTeachers, totalBatches, totalOfferings] = await Promise.all([
    Program.countDocuments({ departmentId: did, ...nd }),
    Subject.countDocuments({ departmentId: did, ...nd }),
    StaffMember.countDocuments({ 'employments.departmentId': did, ...nd }),
    Batch.countDocuments({ departmentId: did, ...nd }),
    CourseOffering.countDocuments({ programId: { $in: (await Program.find({ departmentId: did, ...nd }).select("_id")).map(p => p._id) }, ...nd }),
  ]);

  const data = populated.toObject();
  data.stats = {
    totalPrograms,
    totalSubjects,
    totalTeachers,
    totalBatches,
    totalOfferings,
  };

  res.json({ success: true, data });
});

export const createDepartment = handle(async (req, res) => {
  const {
    campusIds: rawCampusIds,
    campusAssignments: rawAssignments,
    name,
    code,
    description,
    facultyIds: rawFacultyIds,
  } = req.body;

  const campusIds = Array.isArray(rawCampusIds) && rawCampusIds.length > 0
    ? [...new Set(rawCampusIds.filter(Boolean))]
    : [];

  if (campusIds.length === 0 || !name || !code) {
    return res.status(400).json({
      success: false,
      message: 'At least one campus, name and code are required',
    });
  }

  const campError = await validateCampusesExist(campusIds);
  if (campError) {
    return res.status(400).json({ success: false, message: campError.message });
  }

  const duplicate = await findDuplicateDepartment({ campusIds, name, code });
  if (duplicate) {
    const message = duplicate.isDeleted
      ? 'A department with this name or code was previously deleted. Use a different name or code.'
      : 'A department with this name already exists at one of the selected campuses, or this code is already taken';
    return res.status(duplicate.isDeleted ? 409 : 400).json({ success: false, message });
  }

  const facultyIds = Array.isArray(rawFacultyIds) && rawFacultyIds.length > 0
    ? [...new Set(rawFacultyIds.filter(Boolean))]
    : [];

  if (facultyIds.length > 0) {
    const facError = await validateFacultiesExist(facultyIds);
    if (facError) {
      return res.status(400).json({ success: false, message: facError.message });
    }
  }

  let campusAssignments;
  if (Array.isArray(rawAssignments) && rawAssignments.length > 0) {
    const asgErr = await validateCampusAssignments(rawAssignments);
    if (asgErr) return res.status(400).json({ success: false, message: asgErr.message });
    campusAssignments = rawAssignments.map((a) => ({
      campus: a.campus,
      headId: a.headId || null,
      email: a.email || '',
      phone: a.phone || '',
      location: a.location || '',
      establishedDate: a.establishedDate ? new Date(a.establishedDate) : null,
      status: a.status || 'Active',
    }));
  } else {
    campusAssignments = campusIds.map((cid) => ({
      campus: cid,
      headId: null,
      email: '',
      phone: '',
      location: '',
      establishedDate: null,
      status: 'Active',
    }));
  }

  const departmentId = await generateDepartmentId();

  const department = new Department({
    departmentId,
    campusIds,
    campusAssignments,
    name: name.trim(),
    code: code.toUpperCase().trim(),
    description: description || '',
    facultyIds,
  });

  await department.save();

  let q = Department.findById(department._id);
  const populated = await populateDepartment(q);

  res.status(201).json({
    success: true,
    data: populated,
    message: 'Department created successfully',
  });
});

export const updateDepartment = handle(async (req, res) => {
  const { id } = req.params;
  const {
    campusIds: rawCampusIds,
    campusAssignments: rawAssignments,
    name,
    code,
    description,
    facultyIds: rawFacultyIds,
  } = req.body;

  const department = await findDepartmentByIdentifier(id);
  if (!department) {
    return res.status(404).json({
      success: false,
      message: 'Department not found',
    });
  }

  if (rawCampusIds !== undefined) {
    let campusIds;
    if (Array.isArray(rawCampusIds)) {
      campusIds = [...new Set(rawCampusIds.filter(Boolean))];
    } else {
      campusIds = department.campusIds || [];
    }

    if (campusIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one campus is required',
      });
    }

    const campError = await validateCampusesExist(campusIds);
    if (campError) {
      return res.status(400).json({ success: false, message: campError.message });
    }

    department.campusIds = campusIds;

    if (Array.isArray(rawAssignments)) {
      const asgErr = await validateCampusAssignments(rawAssignments);
      if (asgErr) return res.status(400).json({ success: false, message: asgErr.message });
      department.campusAssignments = rawAssignments.map((a) => ({
        campus: a.campus,
        headId: a.headId || null,
        email: a.email || '',
        phone: a.phone || '',
        location: a.location || '',
        establishedDate: a.establishedDate ? new Date(a.establishedDate) : null,
        status: a.status || 'Active',
      }));
    } else {
      department.campusAssignments = syncCampusAssignments(
        department.campusAssignments || [],
        campusIds
      );
    }
  } else if (Array.isArray(rawAssignments)) {
    const asgErr = await validateCampusAssignments(rawAssignments);
    if (asgErr) return res.status(400).json({ success: false, message: asgErr.message });
    department.campusAssignments = rawAssignments.map((a) => ({
      campus: a.campus,
      headId: a.headId || null,
      email: a.email || '',
      phone: a.phone || '',
      location: a.location || '',
      establishedDate: a.establishedDate ? new Date(a.establishedDate) : null,
      status: a.status || 'Active',
    }));
  }

  if (name !== undefined && name !== '') {
    department.name = name.trim();
  }

  if (code !== undefined && code !== '') {
    department.code = code.toUpperCase().trim();
  }

  if (department.name && department.code && department.campusIds?.length > 0) {
    const duplicate = await findDuplicateDepartment({
      campusIds: department.campusIds,
      name: department.name,
      code: department.code,
      excludeId: department._id,
    });
    if (duplicate) {
      const message = duplicate.isDeleted
        ? 'A department with this name or code was previously deleted. Use a different name or code.'
        : 'A department with this name already exists at one of the selected campuses, or this code is already taken';
      return res.status(duplicate.isDeleted ? 409 : 400).json({ success: false, message });
    }
  }

  if (rawFacultyIds !== undefined) {
    let facultyIds;
    if (Array.isArray(rawFacultyIds)) {
      facultyIds = [...new Set(rawFacultyIds.filter(Boolean))];
    } else {
      facultyIds = department.facultyIds || [];
    }

    if (facultyIds.length > 0) {
      const facError = await validateFacultiesExist(facultyIds);
      if (facError) {
        return res.status(400).json({ success: false, message: facError.message });
      }
    }

    department.facultyIds = facultyIds;
  }

  if (description !== undefined) department.description = description;

  await department.save();

  let q = Department.findById(department._id);
  const populated = await populateDepartment(q);

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

  const [programCount, subjectCount, teacherCount, batchCount] = await Promise.all([
    Program.countDocuments(deptFilter),
    Subject.countDocuments(deptFilter),
    StaffMember.countDocuments({ 'employments.departmentId': department._id, isDeleted: { $ne: true } }),
    Batch.countDocuments(deptFilter),
  ]);

  if (programCount > 0 || subjectCount > 0 || teacherCount > 0 || batchCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete department while programs, subjects, teachers, or batches are still linked. Remove or reassign them first, or deactivate the department.',
      programCount,
      subjectCount,
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
        from: 'subjects',
        let: { deptId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$departmentId', '$$deptId'] }, isDeleted: notDeleted } },
        ],
        as: 'subjects',
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
        campusIds: 1,
        campusAssignments: 1,
        subjectCount: { $size: '$subjects' },
        programCount: { $size: '$programs' },
        teacherCount: { $size: '$teachers' },
        totalCredits: { $sum: '$subjects.credits' },
      },
    },
    { $sort: { subjectCount: -1 } },
  ]);

  const totalDepartments = await Department.countDocuments({ isDeleted: notDeleted });
  const activeDepartments = await Department.countDocuments({ isDeleted: notDeleted, 'campusAssignments.status': 'Active' });

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
