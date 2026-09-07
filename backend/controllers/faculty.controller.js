import mongoose from 'mongoose';
import { handle } from "../utils/asyncHandler.js";
import { Faculty, Department, StaffMember, Program, Batch, Subject, Campus } from '../models/index.js';
import { generateFacultyId } from "../utils/generateFacultyId.js";

async function findFacultyByIdentifier(identifier) {
  const query = [{ facultyId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return Faculty.findOne({ $or: query, isDeleted: { $ne: true } });
}

export const getFaculties = handle(async (req, res) => {
  const { campusId, status, search, page = 1, limit = 100 } = req.query;
  const filter = { isDeleted: { $ne: true } };
  if (campusId) filter.campusIds = campusId;
  if (status) filter.status = status;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const faculties = await Faculty.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ name: 1 })
    .populate('campusIds', 'name campusCode')
    .populate('campusAssignments.campusId', 'name campusCode')
    .populate('campusAssignments.headId', 'staffId firstName lastName')
    .select('-__v');

  const totalCount = await Faculty.countDocuments(filter);

  const facultyIds = faculties.map((f) => f._id);
  const deptCounts = await Department.aggregate([
    { $match: { facultyId: { $in: facultyIds }, isDeleted: { $ne: true } } },
    { $group: { _id: "$facultyId", count: { $sum: 1 } } },
  ]);
  const deptCountMap = new Map(deptCounts.map((d) => [String(d._id), d.count]));

  const data = faculties.map((f) => {
    const obj = f.toObject();
    obj.departmentCount = deptCountMap.get(String(f._id)) || 0;
    return obj;
  });

  res.json({
    success: true,
    count: data.length,
    total: totalCount,
    page: parseInt(page),
    totalPages: Math.ceil(totalCount / parseInt(limit)),
    data,
  });
});

export const getFacultyById = handle(async (req, res) => {
  const faculty = await findFacultyByIdentifier(req.params.id);

  if (!faculty) {
    return res.status(404).json({
      success: false,
      message: 'Faculty not found',
    });
  }

  const populated = await Faculty.findById(faculty._id)
    .populate('campusIds', 'name campusCode')
    .populate('campusAssignments.campusId', 'name campusCode')
    .populate('campusAssignments.headId', 'staffId firstName lastName email');

  const fid = faculty._id;
  const nd = { isDeleted: { $ne: true } };

  const [totalDepartments, totalPrograms, totalSubjects, totalBatches] = await Promise.all([
    Department.countDocuments({ facultyId: fid, ...nd }),
    Program.countDocuments({ departmentId: { $in: (await Department.find({ facultyId: fid, ...nd }).select("_id")).map(d => d._id) }, ...nd }),
    Subject.countDocuments({ departmentId: { $in: (await Department.find({ facultyId: fid, ...nd }).select("_id")).map(d => d._id) }, ...nd }),
    Batch.countDocuments({ departmentId: { $in: (await Department.find({ facultyId: fid, ...nd }).select("_id")).map(d => d._id) }, ...nd }),
  ]);

  const data = populated.toObject();
  data.stats = {
    totalDepartments,
    totalPrograms,
    totalSubjects,
    totalBatches,
  };

  res.json({ success: true, data });
});

export const createFaculty = handle(async (req, res) => {
  const { campusIds, campusAssignments, name, code, description, status } = req.body;

  if (!name || !code) {
    return res.status(400).json({
      success: false,
      message: 'name and code are required',
    });
  }

  const normalizedName = name.trim();
  const normalizedCode = code.toUpperCase().trim();

  const existing = await Faculty.findOne({
    $or: [{ name: normalizedName }, { code: normalizedCode }],
    isDeleted: false,
  });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'Faculty with this name or code already exists',
    });
  }

  const facultyId = await generateFacultyId();

  const resolvedCampusIds = Array.isArray(campusIds)
    ? [...new Set(campusIds.map((id) => (typeof id === 'object' && id?._id ? id._id : id)).filter(Boolean))]
    : [];

  const assignments = Array.isArray(campusAssignments) && campusAssignments.length > 0
    ? campusAssignments
    : resolvedCampusIds.map((campusId) => ({ campusId }));

  if (assignments.length > 0) {
    const allCampusIds = assignments.map((a) => (typeof a.campusId === 'object' && a.campusId?._id ? a.campusId._id : a.campusId)).filter(Boolean);
    const uniqueCampusIds = [...new Set(allCampusIds)];
    if (uniqueCampusIds.length !== allCampusIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate campus rows in campusAssignments are not allowed',
      });
    }
    const validCampuses = await Campus.find({ _id: { $in: allCampusIds }, isDeleted: { $ne: true } });
    if (validCampuses.length !== allCampusIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more selected campuses were not found',
      });
    }

    const headIdsInAssignments = assignments
      .map((a) => (typeof a.headId === 'object' && a.headId?._id ? a.headId._id : a.headId))
      .filter(Boolean);
    if (headIdsInAssignments.length > 0) {
      const validHeads = await StaffMember.countDocuments({ _id: { $in: headIdsInAssignments }, isDeleted: { $ne: true } });
      if (validHeads !== headIdsInAssignments.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more campus assignment heads were not found',
        });
      }
    }
  }

  const faculty = new Faculty({
    facultyId,
    campusIds: resolvedCampusIds,
    campusAssignments: assignments,
    name: normalizedName,
    code: normalizedCode,
    description: description || '',
    status: status || 'Active',
    createdBy: req.user?._id || null,
    updatedBy: req.user?._id || null,
  });

  await faculty.save();

  const populated = await Faculty.findById(faculty._id)
    .populate('campusIds', 'name campusCode')
    .populate('campusAssignments.campusId', 'name campusCode')
    .populate('campusAssignments.headId', 'staffId firstName lastName email');

  res.status(201).json({
    success: true,
    data: populated,
    message: 'Faculty created successfully',
  });
});

export const updateFaculty = handle(async (req, res) => {
  const { id } = req.params;
  const { campusIds, campusAssignments, name, code, description, status } = req.body;

  const faculty = await findFacultyByIdentifier(id);
  if (!faculty) {
    return res.status(404).json({
      success: false,
      message: 'Faculty not found',
    });
  }

  if (name !== undefined && name !== '') {
    const trimmedName = name.trim();
    const existing = await Faculty.findOne({
      name: trimmedName,
      _id: { $ne: faculty._id },
      isDeleted: false,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Faculty name already exists',
      });
    }
    faculty.name = trimmedName;
  }

  if (code !== undefined && code !== '') {
    const trimmedCode = code.toUpperCase().trim();
    const existing = await Faculty.findOne({
      code: trimmedCode,
      _id: { $ne: faculty._id },
      isDeleted: false,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Faculty code already exists',
      });
    }
    faculty.code = trimmedCode;
  }

  if (campusIds !== undefined || campusAssignments !== undefined) {
    const incomingAssignments = Array.isArray(campusAssignments) && campusAssignments.length > 0
      ? campusAssignments
      : null;
    const incomingCampusIds = Array.isArray(campusIds)
      ? [...new Set(campusIds.map((c) => (typeof c === 'object' && c?._id ? c._id : c)).filter(Boolean))]
      : null;

    let resolvedCampusIds;
    let assignments;
    if (incomingAssignments && incomingCampusIds) {
      // Both provided — assignments are authoritative; campusIds must be a subset.
      const assignmentCampusIds = [...new Set(
        incomingAssignments
          .map((a) => (typeof a.campusId === 'object' && a.campusId?._id ? a.campusId._id : a.campusId))
          .filter(Boolean)
      )];
      const onlyInIds = incomingCampusIds.filter((id) => !assignmentCampusIds.includes(id));
      if (onlyInIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'campusIds contains campuses not present in campusAssignments',
        });
      }
      resolvedCampusIds = assignmentCampusIds;
      assignments = incomingAssignments;
    } else if (incomingAssignments) {
      const assignmentCampusIds = [...new Set(
        incomingAssignments
          .map((a) => (typeof a.campusId === 'object' && a.campusId?._id ? a.campusId._id : a.campusId))
          .filter(Boolean)
      )];
      resolvedCampusIds = assignmentCampusIds;
      assignments = incomingAssignments;
    } else if (incomingCampusIds) {
      resolvedCampusIds = incomingCampusIds;
      assignments = incomingCampusIds.map((campusId) => ({ campusId }));
    } else {
      resolvedCampusIds = faculty.campusIds || [];
      assignments = faculty.campusAssignments || [];
    }

    if (assignments.length > 0) {
      const allCampusIds = assignments.map((a) => (typeof a.campusId === 'object' && a.campusId?._id ? a.campusId._id : a.campusId)).filter(Boolean);
      const uniqueCampusIds = [...new Set(allCampusIds)];
      if (uniqueCampusIds.length !== allCampusIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate campus rows in campusAssignments are not allowed',
        });
      }
      const validCampuses = await Campus.find({ _id: { $in: allCampusIds }, isDeleted: { $ne: true } });
      if (validCampuses.length !== allCampusIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more selected campuses were not found',
        });
      }

      const headIdsInAssignments = assignments
        .map((a) => (typeof a.headId === 'object' && a.headId?._id ? a.headId._id : a.headId))
        .filter(Boolean);
      if (headIdsInAssignments.length > 0) {
        const validHeads = await StaffMember.countDocuments({ _id: { $in: headIdsInAssignments }, isDeleted: { $ne: true } });
        if (validHeads !== headIdsInAssignments.length) {
          return res.status(400).json({
            success: false,
            message: 'One or more campus assignment heads were not found',
          });
        }
      }
    }

    faculty.campusIds = resolvedCampusIds;
    faculty.campusAssignments = assignments;
  }

  if (description !== undefined) faculty.description = description;
  if (status !== undefined && status !== '') faculty.status = status;

  faculty.updatedBy = req.user?._id || null;
  await faculty.save();

  const populated = await Faculty.findById(faculty._id)
    .populate('campusIds', 'name campusCode')
    .populate('campusAssignments.campusId', 'name campusCode')
    .populate('campusAssignments.headId', 'staffId firstName lastName email');

  res.json({
    success: true,
    data: populated,
    message: 'Faculty updated successfully',
  });
});

export const deleteFaculty = handle(async (req, res) => {
  const { id } = req.params;

  const faculty = await findFacultyByIdentifier(id);
  if (!faculty) {
    return res.status(404).json({
      success: false,
      message: 'Faculty not found',
    });
  }

  // Check for departments using this faculty
  const deptCount = await Department.countDocuments({ facultyId: faculty._id, isDeleted: { $ne: true } });
  if (deptCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete faculty with ${deptCount} departments. Remove departments first or deactivate the faculty.`,
      departmentCount: deptCount,
    });
  }

  const now = new Date();
  const deletedBy = req.user?._id || null;

  await faculty.updateOne({
    isDeleted: true,
    deletedAt: now,
    deletedBy,
  });

  res.json({
    success: true,
    message: 'Faculty deleted successfully',
  });
});

export const getFacultyStats = handle(async (req, res) => {
  const stats = await Faculty.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: 'facultyId',
        as: 'departments',
      },
    },
    {
      $lookup: {
        from: 'campuses',
        localField: 'campusIds',
        foreignField: '_id',
        as: 'campuses',
      },
    },
    {
      $project: {
        name: 1,
        code: 1,
        campusIds: 1,
        status: 1,
        departmentCount: { $size: '$departments' },
        campusCount: { $size: '$campuses' },
      },
    },
    { $sort: { departmentCount: -1 } },
  ]);

  const totalFaculties = await Faculty.countDocuments({ isDeleted: { $ne: true } });
  const activeFaculties = await Faculty.countDocuments({ status: 'Active', isDeleted: { $ne: true } });

  res.json({
    success: true,
    data: {
      total: totalFaculties,
      active: activeFaculties,
      inactive: totalFaculties - activeFaculties,
      faculties: stats,
    },
  });
});
