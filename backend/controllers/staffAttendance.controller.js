import mongoose from 'mongoose';
import { handle } from '../utils/asyncHandler.js';
import { StaffAttendance, StaffLeave, StaffMember } from '../models/index.js';
import { evaluateAttendanceAgainstSchedule } from '../utils/workScheduleUtils.js';

const notDeleted = { $ne: true };

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

async function findStaff(identifier) {
  const query = [{ staffId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return StaffMember.findOne({ $or: query, isDeleted: notDeleted });
}

async function hasApprovedLeave(staffId, date) {
  const day = startOfDay(date);
  return StaffLeave.findOne({
    staffMember: staffId,
    status: 'Approved',
    isDeleted: notDeleted,
    startDate: { $lte: day },
    endDate: { $gte: day },
  });
}

export const listStaffAttendance = handle(async (req, res) => {
  const { staffMemberId, date, status, page = 1, limit = 100 } = req.query;
  const filter = { isDeleted: notDeleted };

  if (staffMemberId) filter.staffMember = staffMemberId;
  if (status) filter.status = status;
  if (date) filter.date = startOfDay(date);

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const records = await StaffAttendance.find(filter)
    .populate('staffMember', 'staffId firstName lastName email')
    .sort({ date: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10));

  const total = await StaffAttendance.countDocuments(filter);
  res.json({ success: true, count: records.length, total, data: records });
});

export const markStaffAttendance = handle(async (req, res) => {
  const { staffMemberId, date, checkInTime, checkOutTime, remarks } = req.body;

  if (!staffMemberId || !date) {
    return res.status(400).json({
      success: false,
      message: 'staffMemberId and date are required',
    });
  }

  const staff = await findStaff(staffMemberId);
  if (!staff) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }

  const attendanceDate = startOfDay(date);
  const leave = await hasApprovedLeave(staff._id, attendanceDate);
  const evaluation = evaluateAttendanceAgainstSchedule({
    workSchedule: staff.workSchedule || [],
    date: attendanceDate,
    checkInTime,
  });

  let status = evaluation.status;
  let finalRemarks = remarks || evaluation.remarks || '';
  let leaveRef = null;

  if (leave) {
    status = 'Leave';
    finalRemarks = finalRemarks || 'Approved leave';
    leaveRef = leave._id;
  } else if (!evaluation.isWorkingDay) {
    status = 'Off-day';
  }

  const payload = {
    staffMember: staff._id,
    staffName: `${staff.firstName} ${staff.lastName}`.trim(),
    date: attendanceDate,
    checkInTime: checkInTime || '',
    checkOutTime: checkOutTime || '',
    scheduledStart: evaluation.scheduledStart || '',
    scheduledEnd: evaluation.scheduledEnd || '',
    isWorkingDay: evaluation.isWorkingDay,
    isLate: evaluation.isLate,
    lateMinutes: evaluation.lateMinutes,
    status,
    leaveRef,
    remarks: finalRemarks,
    markedBy: req.user?._id || null,
  };

  const record = await StaffAttendance.findOneAndUpdate(
    { staffMember: staff._id, date: attendanceDate, isDeleted: notDeleted },
    payload,
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.json({ success: true, data: record });
});

export const getStaffAttendanceStats = handle(async (req, res) => {
  const date = req.query.date ? startOfDay(req.query.date) : startOfDay(new Date());
  const match = { isDeleted: notDeleted, date };

  const [present, late, absent, leave, offDay] = await Promise.all([
    StaffAttendance.countDocuments({ ...match, status: 'Present' }),
    StaffAttendance.countDocuments({ ...match, status: 'Late' }),
    StaffAttendance.countDocuments({ ...match, status: 'Absent' }),
    StaffAttendance.countDocuments({ ...match, status: 'Leave' }),
    StaffAttendance.countDocuments({ ...match, status: 'Off-day' }),
  ]);

  res.json({
    success: true,
    data: { date, present, late, absent, leave, offDay },
  });
});

export const bulkMarkStaffAttendance = handle(async (req, res) => {
  const { date, records = [], markAbsentForUnmarked = false } = req.body;

  if (!date) {
    return res.status(400).json({ success: false, message: 'date is required' });
  }

  const attendanceDate = startOfDay(date);
  const results = [];

  if (Array.isArray(records) && records.length > 0) {
    for (const record of records) {
      const staff = await findStaff(record.staffMemberId);
      if (!staff) continue;

      const leave = await hasApprovedLeave(staff._id, attendanceDate);
      const evaluation = evaluateAttendanceAgainstSchedule({
        workSchedule: staff.workSchedule || [],
        date: attendanceDate,
        checkInTime: record.checkInTime,
      });

      let status = record.status || evaluation.status;
      let finalRemarks = record.remarks || evaluation.remarks || '';
      let leaveRef = null;

      if (leave) {
        status = 'Leave';
        finalRemarks = finalRemarks || 'Approved leave';
        leaveRef = leave._id;
      } else if (!evaluation.isWorkingDay) {
        status = 'Off-day';
      } else if (record.status === 'Absent') {
        status = 'Absent';
      }

      const payload = {
        staffMember: staff._id,
        staffName: `${staff.firstName} ${staff.lastName}`.trim(),
        date: attendanceDate,
        checkInTime: record.checkInTime || '',
        checkOutTime: record.checkOutTime || '',
        scheduledStart: evaluation.scheduledStart || '',
        scheduledEnd: evaluation.scheduledEnd || '',
        isWorkingDay: evaluation.isWorkingDay,
        isLate: evaluation.isLate,
        lateMinutes: evaluation.lateMinutes,
        status,
        leaveRef,
        remarks: finalRemarks,
        markedBy: req.user?._id || null,
      };

      const saved = await StaffAttendance.findOneAndUpdate(
        { staffMember: staff._id, date: attendanceDate, isDeleted: notDeleted },
        payload,
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
      results.push(saved);
    }
  }

  if (markAbsentForUnmarked) {
    const markedIds = new Set(results.map((r) => String(r.staffMember)));
    const activeStaff = await StaffMember.find({ status: 'Active', isDeleted: notDeleted });

    for (const staff of activeStaff) {
      if (markedIds.has(String(staff._id))) continue;

      const leave = await hasApprovedLeave(staff._id, attendanceDate);
      const evaluation = evaluateAttendanceAgainstSchedule({
        workSchedule: staff.workSchedule || [],
        date: attendanceDate,
      });

      let status = 'Absent';
      let finalRemarks = 'Auto-marked absent (bulk)';
      let leaveRef = null;

      if (leave) {
        status = 'Leave';
        finalRemarks = 'Approved leave';
        leaveRef = leave._id;
      } else if (!evaluation.isWorkingDay) {
        status = 'Off-day';
        finalRemarks = 'Non-working day';
      }

      const saved = await StaffAttendance.findOneAndUpdate(
        { staffMember: staff._id, date: attendanceDate, isDeleted: notDeleted },
        {
          staffMember: staff._id,
          staffName: `${staff.firstName} ${staff.lastName}`.trim(),
          date: attendanceDate,
          scheduledStart: evaluation.scheduledStart || '',
          scheduledEnd: evaluation.scheduledEnd || '',
          isWorkingDay: evaluation.isWorkingDay,
          isLate: false,
          lateMinutes: 0,
          status,
          leaveRef,
          remarks: finalRemarks,
          markedBy: req.user?._id || null,
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
      results.push(saved);
    }
  }

  res.json({
    success: true,
    data: results,
    message: `Processed ${results.length} attendance record(s)`,
  });
});
