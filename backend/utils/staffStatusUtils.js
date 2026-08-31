import { StaffLeave, StaffMember } from '../models/index.js';

const notDeleted = { $ne: true };

export async function updateStaffStatusFromLeave(staffMemberId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const staff = await StaffMember.findOne({ _id: staffMemberId, isDeleted: notDeleted });
  if (!staff) return null;

  const onLeave = await StaffLeave.findOne({
    staffMember: staffMemberId,
    status: 'Approved',
    isDeleted: notDeleted,
    startDate: { $lte: today },
    endDate: { $gte: today },
  });

  if (onLeave) {
    if (staff.status !== 'On Leave' && !['Resigned', 'Terminated', 'Retired'].includes(staff.status)) {
      staff.status = 'On Leave';
      await staff.save();
    }
  } else if (staff.status === 'On Leave') {
    staff.status = 'Active';
    await staff.save();
  }

  return staff;
}

export async function updateAllStaffStatusesFromLeave() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const staffOnLeaveIds = await StaffLeave.distinct('staffMember', {
    status: 'Approved',
    isDeleted: notDeleted,
    startDate: { $lte: today },
    endDate: { $gte: today },
  });

  const onLeaveSet = new Set(staffOnLeaveIds.map(String));

  const activeStaff = await StaffMember.find({
    isDeleted: notDeleted,
    status: { $in: ['Active', 'On Leave'] },
  });

  let updated = 0;
  for (const staff of activeStaff) {
    const shouldBeOnLeave = onLeaveSet.has(String(staff._id));
    if (shouldBeOnLeave && staff.status !== 'On Leave') {
      staff.status = 'On Leave';
      await staff.save();
      updated += 1;
    } else if (!shouldBeOnLeave && staff.status === 'On Leave') {
      staff.status = 'Active';
      await staff.save();
      updated += 1;
    }
  }

  return updated;
}
