import mongoose from 'mongoose';
import { handle } from '../utils/asyncHandler.js';
import { Subject, Department, Course, ProgramCurriculum } from '../models/index.js';
import { generateSubjectId } from '../utils/generateSubjectId.js';

const notDeleted = { $ne: true };

async function findSubjectByIdentifier(identifier) {
  const query = [{ subjectId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return Subject.findOne({ $or: query, isDeleted: notDeleted });
}

async function validatePrerequisites(prerequisiteSubjectIds, excludeId) {
  if (!prerequisiteSubjectIds?.length) return null;

  const ids = [...new Set(prerequisiteSubjectIds.map(String))];
  if (excludeId && ids.includes(excludeId.toString())) {
    return { status: 400, message: 'A subject cannot be its own prerequisite' };
  }

  const found = await Subject.find({
    _id: { $in: ids },
    isDeleted: notDeleted,
  }).select('_id');

  if (found.length !== ids.length) {
    return { status: 400, message: 'One or more prerequisite subjects were not found' };
  }

  return null;
}

export const getSubjects = handle(async (req, res) => {
  const { departmentId, status, search, page = 1, limit = 100 } = req.query;
  const filter = { isDeleted: notDeleted };

  if (departmentId) filter.departmentId = departmentId;
  if (status) filter.status = status;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { subjectId: { $regex: search, $options: 'i' } },
    ];
  }

  const parsedLimit = parseInt(limit, 10);
  const parsedPage = parseInt(page, 10);
  const skip = (parsedPage - 1) * parsedLimit;

  const [subjects, totalCount] = await Promise.all([
    Subject.find(filter)
      .skip(skip)
      .limit(parsedLimit)
      .sort({ code: 1 })
      .populate('departmentId', 'name code')
      .populate('prerequisiteSubjectIds', 'code name')
      .select('-__v'),
    Subject.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: subjects.length,
    total: totalCount,
    page: parsedPage,
    totalPages: Math.ceil(totalCount / parsedLimit),
    data: subjects,
  });
});

export const getSubjectStats = handle(async (req, res) => {
  const total = await Subject.countDocuments({ isDeleted: notDeleted });
  const active = await Subject.countDocuments({ status: 'Active', isDeleted: notDeleted });

  res.json({
    success: true,
    data: {
      total,
      active,
      inactive: total - active,
    },
  });
});

export const getSubjectById = handle(async (req, res) => {
  const subject = await findSubjectByIdentifier(req.params.id);

  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found',
    });
  }

  const populated = await Subject.findById(subject._id)
    .populate('departmentId', 'name code')
    .populate('prerequisiteSubjectIds', 'code name credits');

  res.json({ success: true, data: populated });
});

export const createSubject = handle(async (req, res) => {
  const {
    code,
    name,
    departmentId,
    credits,
    description,
    prerequisiteSubjectIds,
    status,
  } = req.body;

  if (!code || !name || !departmentId) {
    return res.status(400).json({
      success: false,
      message: 'code, name and departmentId are required',
    });
  }

  const dept = await Department.findOne({ _id: departmentId, isDeleted: notDeleted });
  if (!dept) {
    return res.status(400).json({
      success: false,
      message: 'Department not found',
    });
  }

  const trimmedCode = String(code).toUpperCase().trim();
  const duplicate = await Subject.findOne({ code: trimmedCode });
  if (duplicate) {
    const message = duplicate.isDeleted
      ? 'A subject with this code was previously deleted. Use a different code.'
      : `Subject with code ${trimmedCode} already exists`;
    return res.status(duplicate.isDeleted ? 409 : 400).json({ success: false, message });
  }

  const prereqError = await validatePrerequisites(prerequisiteSubjectIds);
  if (prereqError) {
    return res.status(prereqError.status).json({
      success: false,
      message: prereqError.message,
    });
  }

  const subject = new Subject({
    subjectId: await generateSubjectId(),
    code: trimmedCode,
    name: String(name).trim(),
    departmentId,
    credits: credits ? Number(credits) : 3,
    description: description || '',
    prerequisiteSubjectIds: prerequisiteSubjectIds || [],
    status: status || 'Active',
  });

  await subject.save();

  const populated = await Subject.findById(subject._id)
    .populate('departmentId', 'name code')
    .populate('prerequisiteSubjectIds', 'code name');

  res.status(201).json({
    success: true,
    data: populated,
    message: 'Subject created successfully',
  });
});

export const updateSubject = handle(async (req, res) => {
  const subject = await findSubjectByIdentifier(req.params.id);
  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found',
    });
  }

  const {
    code,
    name,
    departmentId,
    credits,
    description,
    prerequisiteSubjectIds,
    status,
  } = req.body;

  if (code !== undefined && code !== '') {
    const trimmedCode = String(code).toUpperCase().trim();
    const duplicate = await Subject.findOne({
      code: trimmedCode,
      _id: { $ne: subject._id },
    });
    if (duplicate) {
      const message = duplicate.isDeleted
        ? 'A subject with this code was previously deleted. Use a different code.'
        : 'Subject code already exists';
      return res.status(duplicate.isDeleted ? 409 : 400).json({ success: false, message });
    }
    subject.code = trimmedCode;
  }

  if (name !== undefined && name !== '') subject.name = String(name).trim();

  if (departmentId !== undefined && departmentId !== '') {
    const dept = await Department.findOne({ _id: departmentId, isDeleted: notDeleted });
    if (!dept) {
      return res.status(400).json({ success: false, message: 'Department not found' });
    }
    subject.departmentId = departmentId;
  }

  if (credits !== undefined) subject.credits = Number(credits) || subject.credits;
  if (description !== undefined) subject.description = description;

  if (prerequisiteSubjectIds !== undefined) {
    const prereqError = await validatePrerequisites(prerequisiteSubjectIds, subject._id);
    if (prereqError) {
      return res.status(prereqError.status).json({
        success: false,
        message: prereqError.message,
      });
    }
    subject.prerequisiteSubjectIds = prerequisiteSubjectIds;
  }

  if (status !== undefined && status !== '') subject.status = status;

  await subject.save();

  const populated = await Subject.findById(subject._id)
    .populate('departmentId', 'name code')
    .populate('prerequisiteSubjectIds', 'code name');

  res.json({
    success: true,
    data: populated,
    message: 'Subject updated successfully',
  });
});

export const deleteSubject = handle(async (req, res) => {
  const subject = await findSubjectByIdentifier(req.params.id);
  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found',
    });
  }

  const [prerequisiteForCount, legacyCourseCount, curriculumCount] = await Promise.all([
    Subject.countDocuments({
      isDeleted: notDeleted,
      prerequisiteSubjectIds: subject._id,
      _id: { $ne: subject._id },
    }),
    Course.countDocuments({
      isDeleted: notDeleted,
      code: subject.code,
    }),
    ProgramCurriculum.countDocuments({
      isDeleted: notDeleted,
      subjectId: subject._id,
    }),
  ]);

  if (prerequisiteForCount > 0 || legacyCourseCount > 0 || curriculumCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete subject while it is a prerequisite, linked in a program curriculum, or linked to legacy courses.',
      prerequisiteForCount,
      legacyCourseCount,
      curriculumCount,
    });
  }

  subject.isDeleted = true;
  subject.deletedAt = new Date();
  subject.deletedBy = req.user?._id || null;
  subject.status = 'Inactive';
  await subject.save();

  res.json({
    success: true,
    message: 'Subject deleted successfully',
  });
});
