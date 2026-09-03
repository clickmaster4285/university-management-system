import mongoose from 'mongoose';
import { handle } from '../utils/asyncHandler.js';
import { StaffLeave, StaffMember } from '../models/index.js';
import {
  applyLeaveBalanceChange,
  getBalanceYear,
  getLeaveBalanceSummary,
  getOrCreateLeaveBalance,
  validateLeaveBalance,
} from '../utils/leaveBalanceUtils.js';
import { updateStaffStatusFromLeave } from '../utils/staffStatusUtils.js';

const notDeleted = { $ne: true };

async function findStaff(identifier) {
  const query = [{ staffId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return StaffMember.findOne({ $or: query, isDeleted: notDeleted });
}

export const listStaffLeaves = handle(async (req, res) => {
  const { staffMemberId, status, page = 1, limit = 100 } = req.query;
  const filter = { isDeleted: notDeleted };

  if (staffMemberId) filter.staffMember = staffMemberId;
  if (status) filter.status = status;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const leaves = await StaffLeave.find(filter)
    .populate('staffMember', 'staffId firstName lastName email')
    .populate('approvedBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10));

  const total = await StaffLeave.countDocuments(filter);

  res.json({ success: true, count: leaves.length, total, data: leaves });
});

export const createStaffLeave = handle(async (req, res) => {
  const { staffMemberId, type, startDate, endDate, reason } = req.body;

  if (!staffMemberId || !type || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'staffMemberId, type, startDate, and endDate are required',
    });
  }

  const staff = await findStaff(staffMemberId);
  if (!staff) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const balanceCheck = await validateLeaveBalance(staff._id, type, days, getBalanceYear(start));
  if (!balanceCheck.ok) {
    return res.status(400).json({ success: false, message: balanceCheck.message });
  }

  const leave = await StaffLeave.create({
    staffMember: staff._id,
    staffName: `${staff.firstName} ${staff.lastName}`.trim(),
    type,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    reason: reason || '',
  });

  res.status(201).json({ success: true, data: leave });
});

export const updateStaffLeaveStatus = handle(async (req, res) => {
  const leave = await StaffLeave.findOne({ _id: req.params.id, isDeleted: notDeleted });
  if (!leave) {
    return res.status(404).json({ success: false, message: 'Leave request not found' });
  }

  const { status, rejectionReason } = req.body;
  if (!['Approved', 'Rejected', 'Cancelled'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const previousStatus = leave.status;

  leave.status = status;
  leave.rejectionReason = rejectionReason || '';
  if (status === 'Approved') {
    leave.approvedBy = req.user?._id || null;
    leave.approvedDate = new Date();
  } else {
    leave.approvedBy = null;
    leave.approvedDate = null;
  }

  if (status === 'Approved' && previousStatus !== 'Approved') {
    const balanceCheck = await validateLeaveBalance(
      leave.staffMember,
      leave.type,
      leave.days,
      getBalanceYear(leave.startDate)
    );
    if (!balanceCheck.ok) {
      return res.status(400).json({ success: false, message: balanceCheck.message });
    }
    await applyLeaveBalanceChange(
      leave.staffMember,
      leave.type,
      leave.days,
      'deduct',
      getBalanceYear(leave.startDate)
    );
  }

  if (previousStatus === 'Approved' && status !== 'Approved') {
    await applyLeaveBalanceChange(
      leave.staffMember,
      leave.type,
      leave.days,
      'restore',
      getBalanceYear(leave.startDate)
    );
  }

  await leave.save();
  await updateStaffStatusFromLeave(leave.staffMember);
  res.json({ success: true, data: leave });
});

export const getStaffLeaveBalance = handle(async (req, res) => {
  const staff = await findStaff(req.params.staffMemberId || req.query.staffMemberId);
  if (!staff) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }

  const year = req.query.year ? parseInt(req.query.year, 10) : getBalanceYear();
  const balance = await getLeaveBalanceSummary(staff._id, year);
  res.json({ success: true, data: balance });
});

export const updateStaffLeaveBalance = handle(async (req, res) => {
  const staff = await findStaff(req.params.staffMemberId);
  if (!staff) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }

  const year = req.body.year ? parseInt(req.body.year, 10) : getBalanceYear();
  const doc = await getOrCreateLeaveBalance(staff._id, year);

  const quotaFields = ['annualQuota', 'sickQuota', 'casualQuota', 'maternityQuota', 'paternityQuota'];
  quotaFields.forEach((field) => {
    if (req.body[field] !== undefined) doc[field] = Number(req.body[field]) || 0;
  });
  await doc.save();

  const updated = await getLeaveBalanceSummary(staff._id, year);
  res.json({ success: true, data: updated });
});

export const deleteStaffLeave = handle(async (req, res) => {
  const leave = await StaffLeave.findOne({ _id: req.params.id, isDeleted: notDeleted });
  if (!leave) {
    return res.status(404).json({ success: false, message: 'Leave request not found' });
  }

  leave.isDeleted = true;
  leave.deletedAt = new Date();
  leave.deletedBy = req.user?._id || null;
  await leave.save();

  res.json({ success: true, message: 'Leave request deleted' });
});

export const getStaffLeaveStats = handle(async (_req, res) => {
  const match = { isDeleted: notDeleted };
  const [pending, approved, onLeaveToday] = await Promise.all([
    StaffLeave.countDocuments({ ...match, status: 'Pending' }),
    StaffLeave.countDocuments({ ...match, status: 'Approved' }),
    StaffLeave.countDocuments({
      ...match,
      status: 'Approved',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    }),
  ]);

  res.json({ success: true, data: { pending, approved, onLeaveToday } });
});
