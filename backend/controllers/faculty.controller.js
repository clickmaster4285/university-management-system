import mongoose from 'mongoose';
import { handle } from "../utils/asyncHandler.js";
import { Faculty, Department, StaffMember, Program, Batch, Subject } from '../models/index.js';
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
  if (campusId) filter.campusId = campusId;
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
    .populate('campusId', 'name campusCode')
    .populate('headId', 'staffId firstName lastName email')
    .select('-__v');

  const totalCount = await Faculty.countDocuments(filter);

  res.json({
    success: true,
    count: faculties.length,
    total: totalCount,
    page: parseInt(page),
    totalPages: Math.ceil(totalCount / parseInt(limit)),
    data: faculties,
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
    .populate('campusId', 'name campusCode')
    .populate('headId', 'staffId firstName lastName email');

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
  const { campusId, name, code, description, headId, email, phone, establishedDate, status } = req.body;

  if (!campusId || !name || !code) {
    return res.status(400).json({
      success: false,
      message: 'campusId, name and code are required',
    });
  }

  // Verify campus exists
  const campus = await mongoose.model('Campus').findOne({ _id: campusId, isDeleted: { $ne: true } });
  if (!campus) {
    return res.status(400).json({
      success: false,
      message: `Campus ${campusId} not found`,
    });
  }

  // Check for duplicate name/code within the same campus
  const existing = await Faculty.findOne({
    campusId,
    $or: [{ name: name.trim() }, { code: code.toUpperCase().trim() }],
    isDeleted: { $ne: true },
  });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'Faculty with this name or code already exists in this campus',
    });
  }

  // Verify headId if provided
  if (headId) {
    const head = await StaffMember.findOne({ _id: headId, isDeleted: { $ne: true } });
    if (!head) {
      return res.status(400).json({
        success: false,
        message: `Staff member ${headId} not found`,
      });
    }
  }

  const facultyId = await generateFacultyId(campusId);

  const faculty = new Faculty({
    facultyId,
    campusId,
    name: name.trim(),
    code: code.toUpperCase().trim(),
    description: description || '',
    headId: headId || null,
    email: email || '',
    phone: phone || '',
    establishedDate: establishedDate ? new Date(establishedDate) : null,
    status: status || 'Active',
    createdBy: req.user?._id || null,
    updatedBy: req.user?._id || null,
  });

  await faculty.save();

  const populated = await Faculty.findById(faculty._id)
    .populate('campusId', 'name campusCode')
    .populate('headId', 'staffId firstName lastName email');

  res.status(201).json({
    success: true,
    data: populated,
    message: 'Faculty created successfully',
  });
});

export const updateFaculty = handle(async (req, res) => {
  const { id } = req.params;
  const { campusId, name, code, description, headId, email, phone, establishedDate, status } = req.body;

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
      campusId: faculty.campusId,
      name: trimmedName,
      _id: { $ne: faculty._id },
      isDeleted: { $ne: true },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Faculty name already exists in this campus',
      });
    }
    faculty.name = trimmedName;
  }

  if (code !== undefined && code !== '') {
    const trimmedCode = code.toUpperCase().trim();
    const existing = await Faculty.findOne({
      campusId: faculty.campusId,
      code: trimmedCode,
      _id: { $ne: faculty._id },
      isDeleted: { $ne: true },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Faculty code already exists in this campus',
      });
    }
    faculty.code = trimmedCode;
  }

  if (description !== undefined) faculty.description = description;
  if (status !== undefined && status !== '') faculty.status = status;
  if (headId !== undefined) faculty.headId = headId || null;
  if (email !== undefined) faculty.email = email;
  if (phone !== undefined) faculty.phone = phone;
  if (establishedDate !== undefined) faculty.establishedDate = establishedDate ? new Date(establishedDate) : null;

  faculty.updatedBy = req.user?._id || null;
  await faculty.save();

  const populated = await Faculty.findById(faculty._id)
    .populate('campusId', 'name campusCode')
    .populate('headId', 'staffId firstName lastName email');

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
      $project: {
        name: 1,
        code: 1,
        campusId: 1,
        status: 1,
        departmentCount: { $size: '$departments' },
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
