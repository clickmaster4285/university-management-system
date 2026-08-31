import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { handle } from '../utils/asyncHandler.js';
import { Department, StaffMember, User } from '../models/index.js';
import { generateStaffId } from '../utils/generateStaffId.js';
import {
  mapPrimaryRoleToLegacyRole,
  PLATFORM_ROLES,
  resolveModuleAccess,
} from '../utils/moduleAccessDefaults.js';

const notDeleted = { $ne: true };

async function findStaffByIdentifier(identifier) {
  const query = [{ staffId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return StaffMember.findOne({ $or: query, isDeleted: notDeleted });
}

function populateStaff(query) {
  return query
    .populate('userId', 'firstName lastName email role primaryRole status')
    .populate('employments.departmentId', 'name code')
    .populate('employments.campusId', 'name campusCode');
}

function normalizeEmployments(employments = []) {
  if (!Array.isArray(employments) || employments.length === 0) {
    return { error: 'At least one employment is required' };
  }

  const normalized = employments.map((item) => ({
    departmentId: item.departmentId,
    campusId: item.campusId || null,
    designation: String(item.designation || '').trim(),
    employmentType: item.employmentType || 'Full-time',
    isPrimary: Boolean(item.isPrimary),
    startDate: item.startDate ? new Date(item.startDate) : new Date(),
    endDate: item.endDate ? new Date(item.endDate) : null,
    ...(item._id ? { _id: item._id } : {}),
  }));

  for (const employment of normalized) {
    if (!employment.departmentId || !employment.designation) {
      return { error: 'Each employment needs department and designation' };
    }
  }

  if (!normalized.some((e) => e.isPrimary)) {
    normalized[0].isPrimary = true;
  }

  return { data: normalized };
}

async function validateEmployments(employments) {
  for (const employment of employments) {
    const department = await Department.findOne({
      _id: employment.departmentId,
      isDeleted: notDeleted,
    });
    if (!department) {
      return { error: `Department ${employment.departmentId} not found` };
    }
  }
  return null;
}

function buildTeacherProfile(isAcademic, teacherProfile = {}) {
  if (!isAcademic) return null;
  return {
    summary: teacherProfile.summary || '',
    specialization: teacherProfile.specialization || '',
    researchInterests: teacherProfile.researchInterests || [],
    qualifications: teacherProfile.qualifications || [],
    experience: teacherProfile.experience || [],
    officeHours: teacherProfile.officeHours || '',
    officeLocation: teacherProfile.officeLocation || '',
    orcid: teacherProfile.orcid || '',
    googleScholar: teacherProfile.googleScholar || '',
    researchGate: teacherProfile.researchGate || '',
    linkedin: teacherProfile.linkedin || '',
  };
}

export const getStaffMembers = handle(async (req, res) => {
  const {
    departmentId,
    status,
    isAcademic,
    search,
    page = 1,
    limit = 100,
  } = req.query;

  const filter = { isDeleted: notDeleted };
  if (status) filter.status = status;
  if (isAcademic !== undefined) filter.isAcademic = isAcademic === 'true';
  if (departmentId) filter['employments.departmentId'] = departmentId;

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { staffId: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const staff = await populateStaff(
    StaffMember.find(filter).skip(skip).limit(parseInt(limit, 10)).sort({ createdAt: -1 })
  );
  const total = await StaffMember.countDocuments(filter);

  res.json({
    success: true,
    count: staff.length,
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / parseInt(limit, 10)),
    data: staff,
  });
});

export const getStaffMemberById = handle(async (req, res) => {
  const found = await findStaffByIdentifier(req.params.id);
  if (!found) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }
  const staff = await populateStaff(StaffMember.findById(found._id));
  res.json({ success: true, data: staff });
});

export const getStaffStats = handle(async (req, res) => {
  const match = { isDeleted: notDeleted };
  const [total, active, academic, withLogin] = await Promise.all([
    StaffMember.countDocuments(match),
    StaffMember.countDocuments({ ...match, status: 'Active' }),
    StaffMember.countDocuments({ ...match, isAcademic: true }),
    StaffMember.countDocuments({ ...match, userId: { $ne: null } }),
  ]);

  res.json({
    success: true,
    data: { total, active, academic, withLogin },
  });
});

export const createStaffMember = handle(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    cnic,
    dateOfBirth,
    gender,
    address,
    emergencyContact,
    status = 'Active',
    isAcademic = false,
    employments,
    teacherProfile,
    notes,
  } = req.body;

  if (!firstName || !lastName || !email) {
    return res.status(400).json({
      success: false,
      message: 'firstName, lastName, and email are required',
    });
  }

  const employmentResult = normalizeEmployments(employments);
  if (employmentResult.error) {
    return res.status(400).json({ success: false, message: employmentResult.error });
  }

  const employmentValidation = await validateEmployments(employmentResult.data);
  if (employmentValidation) {
    return res.status(400).json({ success: false, message: employmentValidation.error });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const duplicate = await StaffMember.findOne({
    email: normalizedEmail,
    isDeleted: notDeleted,
  });
  if (duplicate) {
    return res.status(409).json({
      success: false,
      message: `Staff member with email ${normalizedEmail} already exists`,
    });
  }

  const staffId = await generateStaffId();
  const staff = await StaffMember.create({
    staffId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: normalizedEmail,
    phone: phone || '',
    cnic: cnic || '',
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
    gender: gender || '',
    address: address || '',
    emergencyContact: emergencyContact || {},
    status,
    isAcademic: Boolean(isAcademic),
    employments: employmentResult.data,
    teacherProfile: buildTeacherProfile(Boolean(isAcademic), teacherProfile),
    notes: notes || '',
  });

  const populated = await populateStaff(StaffMember.findById(staff._id));
  res.status(201).json({ success: true, data: populated });
});

export const updateStaffMember = handle(async (req, res) => {
  const found = await findStaffByIdentifier(req.params.id);
  if (!found) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }

  const updates = { ...req.body };
  delete updates.staffId;
  delete updates.userId;

  if (updates.email) {
    updates.email = updates.email.toLowerCase().trim();
    const duplicate = await StaffMember.findOne({
      email: updates.email,
      _id: { $ne: found._id },
      isDeleted: notDeleted,
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `Staff member with email ${updates.email} already exists`,
      });
    }
  }

  if (updates.employments) {
    const employmentResult = normalizeEmployments(updates.employments);
    if (employmentResult.error) {
      return res.status(400).json({ success: false, message: employmentResult.error });
    }
    const employmentValidation = await validateEmployments(employmentResult.data);
    if (employmentValidation) {
      return res.status(400).json({ success: false, message: employmentValidation.error });
    }
    updates.employments = employmentResult.data;
  }

  if (updates.isAcademic !== undefined) {
    updates.isAcademic = Boolean(updates.isAcademic);
    updates.teacherProfile = buildTeacherProfile(
      updates.isAcademic,
      updates.teacherProfile || found.teacherProfile || {}
    );
  } else if (updates.teacherProfile && found.isAcademic) {
    updates.teacherProfile = buildTeacherProfile(true, updates.teacherProfile);
  }

  if (updates.dateOfBirth) updates.dateOfBirth = new Date(updates.dateOfBirth);

  const updated = await StaffMember.findByIdAndUpdate(found._id, updates, {
    new: true,
    runValidators: true,
  });
  const populated = await populateStaff(StaffMember.findById(updated._id));
  res.json({ success: true, data: populated });
});

export const deleteStaffMember = handle(async (req, res) => {
  const found = await findStaffByIdentifier(req.params.id);
  if (!found) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }

  found.isDeleted = true;
  found.deletedAt = new Date();
  found.deletedBy = req.user?._id || null;
  await found.save();

  res.json({ success: true, message: 'Staff member deleted successfully' });
});

export const enableStaffLogin = handle(async (req, res) => {
  const found = await findStaffByIdentifier(req.params.id);
  if (!found) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }
  if (found.userId) {
    return res.status(409).json({
      success: false,
      message: 'Login already enabled for this staff member',
    });
  }

  const { password, primaryRole = 'Faculty', moduleAccess } = req.body;
  if (!password || password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password is required and must be at least 8 characters',
    });
  }
  if (!PLATFORM_ROLES.includes(primaryRole)) {
    return res.status(400).json({ success: false, message: 'Invalid primary role' });
  }

  const existingUser = await User.findOne({
    email: found.email,
    isDeleted: notDeleted,
  });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: `User with email ${found.email} already exists`,
    });
  }

  const legacyRole = mapPrimaryRoleToLegacyRole(primaryRole);
  const access = resolveModuleAccess(primaryRole, moduleAccess || {});
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    firstName: found.firstName,
    lastName: found.lastName,
    email: found.email,
    phoneNumber: found.phone || '',
    password: hashedPassword,
    role: legacyRole,
    primaryRole,
    moduleAccess: access,
    staffMemberId: found._id,
    status: 'Active',
  });

  found.userId = user._id;
  await found.save();

  const populated = await populateStaff(StaffMember.findById(found._id));
  res.status(201).json({
    success: true,
    data: populated,
    message: 'Login enabled successfully',
  });
});

export const disableStaffLogin = handle(async (req, res) => {
  const found = await findStaffByIdentifier(req.params.id);
  if (!found) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }
  if (!found.userId) {
    return res.status(400).json({ success: false, message: 'No login exists for this staff member' });
  }

  await User.findByIdAndUpdate(found.userId, {
    status: 'Inactive',
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: req.user?._id || null,
  });

  found.userId = null;
  await found.save();

  const populated = await populateStaff(StaffMember.findById(found._id));
  res.json({
    success: true,
    data: populated,
    message: 'Login disabled successfully',
  });
});

export const getPlatformRoles = handle(async (_req, res) => {
  res.json({ success: true, data: PLATFORM_ROLES });
});
