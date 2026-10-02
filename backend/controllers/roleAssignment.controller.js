import mongoose from 'mongoose';
import { handle } from '../utils/asyncHandler.js';
import {
  AcademicSession,
  Campus,
  Department,
  Faculty,
  Program,
  RoleAssignment,
  StaffMember,
  ROLE_TYPES,
  SCOPE_TYPES,
} from '../models/index.js';

const notDeleted = { $ne: true };

async function findAssignmentById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return RoleAssignment.findOne({ _id: id, isDeleted: notDeleted });
}

async function validateScope(scopeType, scopeId) {
  if (scopeType === 'University') return null;
  if (!scopeId) {
    return 'scopeId is required for this scope type';
  }

  const models = {
    Campus,
    Faculty,
    Department,
    Program,
  };

  const Model = models[scopeType];
  if (!Model) return 'Invalid scope type';

  const found = await Model.findOne({ _id: scopeId, isDeleted: notDeleted });
  if (!found) return `${scopeType} not found`;
  return null;
}

function populateAssignments(query) {
  return query
    .populate('staffMemberId', 'staffId firstName lastName email isAcademic')
    .populate('academicSessionId', 'name code');
}

export const listRoleAssignments = handle(async (req, res) => {
  const { staffMemberId, scopeType, scopeId, roleType } = req.query;
  const filter = { isDeleted: notDeleted };

  if (staffMemberId) filter.staffMemberId = staffMemberId;
  if (scopeType) filter.scopeType = scopeType;
  if (scopeId) filter.scopeId = scopeId;
  if (roleType) filter.roleType = roleType;

  const assignments = await populateAssignments(
    RoleAssignment.find(filter).sort({ createdAt: -1 })
  );

  res.json({
    success: true,
    count: assignments.length,
    data: assignments,
  });
});

export const createRoleAssignment = handle(async (req, res) => {
  const {
    staffMemberId,
    roleType,
    scopeType,
    scopeId,
    academicSessionId,
    startDate,
    endDate,
    notes,
  } = req.body;

  if (!staffMemberId || !roleType || !scopeType) {
    return res.status(400).json({
      success: false,
      message: 'staffMemberId, roleType, and scopeType are required',
    });
  }

  if (!ROLE_TYPES.includes(roleType)) {
    return res.status(400).json({ success: false, message: 'Invalid role type' });
  }
  if (!SCOPE_TYPES.includes(scopeType)) {
    return res.status(400).json({ success: false, message: 'Invalid scope type' });
  }

  const staff = await StaffMember.findOne({ _id: staffMemberId, isDeleted: notDeleted });
  if (!staff) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }

  const scopeError = await validateScope(scopeType, scopeId);
  if (scopeError) {
    return res.status(400).json({ success: false, message: scopeError });
  }

  if (academicSessionId) {
    const session = await AcademicSession.findOne({ _id: academicSessionId, isDeleted: notDeleted });
    if (!session) {
      return res.status(400).json({ success: false, message: 'Academic session not found' });
    }
  }

  const assignment = await RoleAssignment.create({
    staffMemberId,
    roleType,
    scopeType,
    scopeId: scopeType === 'University' ? null : scopeId,
    academicSessionId: academicSessionId || null,
    startDate: startDate ? new Date(startDate) : new Date(),
    endDate: endDate ? new Date(endDate) : null,
    notes: notes || '',
  });

  const populated = await populateAssignments(RoleAssignment.findById(assignment._id));
  res.status(201).json({ success: true, data: populated });
});

export const deleteRoleAssignment = handle(async (req, res) => {
  const assignment = await findAssignmentById(req.params.id);
  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Role assignment not found' });
  }

  assignment.isDeleted = true;
  assignment.deletedAt = new Date();
  assignment.deletedBy = req.user?._id || null;
  await assignment.save();

  res.json({ success: true, message: 'Role assignment removed' });
});

export const getRoleAssignmentMeta = handle(async (_req, res) => {
  res.json({
    success: true,
    data: {
      roleTypes: ROLE_TYPES,
      scopeTypes: SCOPE_TYPES,
    },
  });
});
