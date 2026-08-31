const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const toMinutes = (time = '') => {
  const [h, m] = String(time).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

export const getDayName = (dateInput) => {
  const date = new Date(dateInput);
  return WEEKDAYS[date.getDay()];
};

export const getScheduleForDate = (workSchedule = [], dateInput) => {
  const dayName = getDayName(dateInput);
  return workSchedule.find((entry) => entry.day === dayName) || null;
};

export const evaluateAttendanceAgainstSchedule = ({
  workSchedule = [],
  date,
  checkInTime,
  graceMinutes = 15,
}) => {
  const schedule = getScheduleForDate(workSchedule, date);

  if (!schedule || !schedule.isWorkingDay) {
    return {
      scheduledStart: null,
      scheduledEnd: null,
      isWorkingDay: false,
      isLate: false,
      lateMinutes: 0,
      status: 'Absent',
      remarks: 'Not a scheduled working day',
    };
  }

  const scheduledStart = schedule.startTime;
  const scheduledEnd = schedule.endTime;

  if (!checkInTime) {
    return {
      scheduledStart,
      scheduledEnd,
      isWorkingDay: true,
      isLate: false,
      lateMinutes: 0,
      status: 'Absent',
      remarks: 'No check-in recorded',
    };
  }

  const checkInMinutes = toMinutes(checkInTime);
  const startMinutes = toMinutes(scheduledStart);
  const endMinutes = toMinutes(scheduledEnd);

  if (checkInMinutes === null || startMinutes === null) {
    return {
      scheduledStart,
      scheduledEnd,
      isWorkingDay: true,
      isLate: false,
      lateMinutes: 0,
      status: 'Present',
      remarks: '',
    };
  }

  const lateMinutes = Math.max(0, checkInMinutes - (startMinutes + graceMinutes));
  const isLate = lateMinutes > 0;

  if (endMinutes !== null && checkInMinutes > endMinutes) {
    return {
      scheduledStart,
      scheduledEnd,
      isWorkingDay: true,
      isLate: true,
      lateMinutes,
      status: 'Late',
      remarks: 'Checked in after scheduled end time',
    };
  }

  return {
    scheduledStart,
    scheduledEnd,
    isWorkingDay: true,
    isLate,
    lateMinutes,
    status: isLate ? 'Late' : 'Present',
    remarks: isLate ? `Late by ${lateMinutes} minute(s)` : '',
  };
};
