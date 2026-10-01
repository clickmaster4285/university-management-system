/**
 * Shared helpers for Program public admission windows and degree categories.
 * Used by public catalog (Step 2) and later apply validation (Step 4).
 */

const CATEGORY_ORDER = [
  { key: 'undergraduate', label: 'Undergraduate', levels: ['BS', 'BBA', 'LLB'] },
  { key: 'masters', label: 'Masters / Graduate', levels: ['MS', 'MBA'] },
  { key: 'doctoral', label: 'Doctoral', levels: ['PhD'] },
  { key: 'other', label: 'Other', levels: ['Other'] },
];

const LEVEL_TO_CATEGORY = new Map();
for (const cat of CATEGORY_ORDER) {
  for (const level of cat.levels) {
    LEVEL_TO_CATEGORY.set(level, { key: cat.key, label: cat.label });
  }
}

/**
 * Public “Open” when Active and within optional date window.
 * No dates set ⇒ not open (staff must set a window).
 */
export function isProgramAdmissionOpen(program, now = new Date()) {
  if (!program || program.status !== 'Active') return false;
  const opens = program.admissionOpensAt ? new Date(program.admissionOpensAt) : null;
  const closes = program.admissionClosesAt ? new Date(program.admissionClosesAt) : null;
  if (!opens && !closes) return false;
  if (opens && Number.isNaN(opens.getTime())) return false;
  if (closes && Number.isNaN(closes.getTime())) return false;
  if (opens && now < opens) return false;
  if (closes) {
    const end = new Date(closes);
    end.setHours(23, 59, 59, 999);
    if (now > end) return false;
  }
  return true;
}

export function formatAdmissionWindowLabel(program, now = new Date()) {
  const open = isProgramAdmissionOpen(program, now);
  if (program?.status === 'Inactive') return { label: 'Inactive', open: false };
  if (!program?.admissionOpensAt && !program?.admissionClosesAt) {
    return { label: 'No window set', open: false };
  }
  if (open) {
    const until = program.admissionClosesAt
      ? new Date(program.admissionClosesAt).toISOString().slice(0, 10)
      : 'open-ended';
    return { label: `Open until ${until}`, open: true };
  }
  return { label: 'Closed', open: false };
}

export function getDegreeCategory(degreeLevel) {
  return LEVEL_TO_CATEGORY.get(degreeLevel) || { key: 'other', label: 'Other' };
}

export function getCategoryOrder() {
  return CATEGORY_ORDER.map(({ key, label }) => ({ key, label }));
}

/**
 * Group programs into ordered categories (empty categories omitted).
 */
export function groupProgramsByCategory(programs, serializeProgram) {
  const buckets = new Map(CATEGORY_ORDER.map((c) => [c.key, []]));
  for (const program of programs) {
    const { key } = getDegreeCategory(program.degreeLevel);
    const list = buckets.get(key) || buckets.get('other');
    list.push(serializeProgram ? serializeProgram(program) : program);
  }
  return CATEGORY_ORDER
    .map(({ key, label }) => ({
      key,
      label,
      programs: buckets.get(key) || [],
    }))
    .filter((c) => c.programs.length > 0);
}
