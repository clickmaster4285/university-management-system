import type { StaffMember, WorkScheduleDay } from "@/features/staffMembers";

export const getStaffRecordId = (staff: Pick<StaffMember, "_id" | "staffId">) =>
  staff._id || staff.staffId || "";

export const getStaffDepartmentLabel = (staff: StaffMember) => {
  const primary = staff.employments?.find((e) => e.isPrimary) || staff.employments?.[0];
  if (!primary?.departmentId) return "—";
  if (typeof primary.departmentId === "object") {
    return primary.departmentId.name || primary.departmentId.code || "—";
  }
  return "—";
};

export const formatScheduleSummary = (schedule?: WorkScheduleDay[]) => {
  if (!schedule?.length) return "Not configured";
  const working = schedule.filter((day) => day.isWorkingDay);
  if (working.length === 0) return "No working days";

  const abbrev = (day: string) => day.slice(0, 3);
  const days = working.map((d) => abbrev(d.day)).join(", ");
  const hours = working[0];
  const uniformHours = working.every(
    (d) => d.startTime === hours.startTime && d.endTime === hours.endTime
  );

  if (uniformHours) {
    return `${days} · ${hours.startTime}–${hours.endTime}`;
  }
  return `${working.length} working day${working.length === 1 ? "" : "s"}/week`;
};

export const formatCurrency = (amount?: number, currency = "PKR") => {
  if (amount === undefined || amount === null) return "—";
  return `${currency} ${amount.toLocaleString()}`;
};
