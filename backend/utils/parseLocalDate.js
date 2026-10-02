export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Parse YYYY-MM-DD as local calendar date (avoids UTC shift). */
export function parseLocalDate(value) {
  if (!value) return startOfDay(new Date());
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return startOfDay(new Date(year, month - 1, day));
  }
  return startOfDay(new Date(value));
}

export function dayBefore(date) {
  const d = startOfDay(date);
  d.setDate(d.getDate() - 1);
  return d;
}
