import mongoose from 'mongoose';
import { handle } from '../utils/asyncHandler.js';
import { Payroll, StaffMember } from '../models/index.js';

const notDeleted = { $ne: true };

async function findStaffByIdentifier(identifier) {
  const query = [{ staffId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return StaffMember.findOne({ $or: query, isDeleted: notDeleted });
}

export const getStaffPayrolls = handle(async (req, res) => {
  const staff = await findStaffByIdentifier(req.params.id);
  if (!staff) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }

  const payrolls = await Payroll.find({
    staffMember: staff._id,
    isDeleted: notDeleted,
  })
    .sort({ year: -1, month: -1, createdAt: -1 })
    .limit(24);

  res.json({ success: true, data: payrolls });
});

export const createStaffPayroll = handle(async (req, res) => {
  const staff = await findStaffByIdentifier(req.params.id);
  if (!staff) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }

  const {
    month,
    year,
    baseSalary,
    allowances = 0,
    bonuses = 0,
    deductions = {},
    status = 'Draft',
    paymentDate,
    paymentMethod = 'Bank Transfer',
  } = req.body;

  if (!month || !year || baseSalary === undefined) {
    return res.status(400).json({
      success: false,
      message: 'month, year, and baseSalary are required',
    });
  }

  const payroll = await Payroll.create({
    staffMember: staff._id,
    employeeName: `${staff.firstName} ${staff.lastName}`.trim(),
    month,
    year: Number(year),
    baseSalary: Number(baseSalary),
    allowances: Number(allowances) || 0,
    bonuses: Number(bonuses) || 0,
    deductions: {
      tax: Number(deductions.tax) || 0,
      insurance: Number(deductions.insurance) || 0,
      other: Number(deductions.other) || 0,
    },
    status,
    paymentDate: paymentDate ? new Date(paymentDate) : null,
    paymentMethod,
    createdBy: req.user?._id || null,
  });

  res.status(201).json({ success: true, data: payroll });
});

export const updateStaffPayroll = handle(async (req, res) => {
  const staff = await findStaffByIdentifier(req.params.id);
  if (!staff) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }

  const payroll = await Payroll.findOne({
    _id: req.params.payrollId,
    staffMember: staff._id,
    isDeleted: notDeleted,
  });

  if (!payroll) {
    return res.status(404).json({ success: false, message: 'Payroll record not found' });
  }

  const updates = { ...req.body };
  delete updates.payrollId;
  delete updates.staffMember;
  delete updates.employee;

  if (updates.year) updates.year = Number(updates.year);
  if (updates.baseSalary !== undefined) updates.baseSalary = Number(updates.baseSalary);
  if (updates.allowances !== undefined) updates.allowances = Number(updates.allowances);
  if (updates.bonuses !== undefined) updates.bonuses = Number(updates.bonuses);
  if (updates.paymentDate) updates.paymentDate = new Date(updates.paymentDate);

  const updated = await Payroll.findByIdAndUpdate(payroll._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, data: updated });
});

export const deleteStaffPayroll = handle(async (req, res) => {
  const staff = await findStaffByIdentifier(req.params.id);
  if (!staff) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }

  const payroll = await Payroll.findOne({
    _id: req.params.payrollId,
    staffMember: staff._id,
    isDeleted: notDeleted,
  });

  if (!payroll) {
    return res.status(404).json({ success: false, message: 'Payroll record not found' });
  }

  payroll.isDeleted = true;
  payroll.deletedAt = new Date();
  payroll.deletedBy = req.user?._id || null;
  await payroll.save();

  res.json({ success: true, message: 'Payroll record deleted' });
});

export const listAllPayrolls = handle(async (req, res) => {
  const { status, month, year, limit = 100 } = req.query;
  const filter = { isDeleted: notDeleted, staffMember: { $ne: null } };

  if (status) filter.status = status;
  if (month) filter.month = month;
  if (year) filter.year = Number(year);

  const payrolls = await Payroll.find(filter)
    .populate('staffMember', 'staffId firstName lastName email')
    .sort({ year: -1, month: -1, createdAt: -1 })
    .limit(parseInt(limit, 10));

  res.json({ success: true, count: payrolls.length, data: payrolls });
});
