/**
 * Shared helpers for Program public admission windows and degree categories.
 * Used by public catalog (Step 2) and apply validation (Step 4).
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

export function getAdmissionClosedMessage(program, now = new Date()) {
  if (isProgramAdmissionOpen(program, now)) return null;
  if (program?.status !== 'Active') {
    return 'Selected program is not available for admission.';
  }
  if (!program?.admissionOpensAt && !program?.admissionClosesAt) {
    return 'Admissions are not open for this program yet. Choose an open program from the catalog.';
  }
  const { label } = formatAdmissionWindowLabel(program, now);
  return `Admissions for this program are closed (${label}). Choose an open program from the catalog.`;
}

/**
 * Validate program + campus for a new public application (or when changing selection).
 * Returns { ok, status?, message?, program?, campus? }.
 */
export async function assertPublicApplyEligibility({
  Program,
  Campus,
  Department,
  programId,
  campusId,
  now = new Date(),
}) {
  const program = await Program.findOne({ _id: programId, isDeleted: { $ne: true } });
  if (!program) {
    return { ok: false, status: 400, message: 'Invalid program selected' };
  }

  const campus = await Campus.findOne({ _id: campusId, isDeleted: { $ne: true } });
  if (!campus) {
    return { ok: false, status: 400, message: 'Invalid campus selected' };
  }
  if (campus.status !== 'Active') {
    return {
      ok: false,
      status: 400,
      message: 'Selected campus is not accepting applications',
    };
  }

  const closedMessage = getAdmissionClosedMessage(program, now);
  if (closedMessage) {
    return { ok: false, status: 400, message: closedMessage };
  }

  const dept = await Department.findOne({
    _id: program.departmentId,
    isDeleted: { $ne: true },
  }).select('campusIds');

  if (!dept) {
    return { ok: false, status: 400, message: 'Program department not found' };
  }

  const campusIds = (dept.campusIds || []).map((id) => String(id));
  if (!campusIds.includes(String(campus._id))) {
    return {
      ok: false,
      status: 400,
      message: 'This program is not offered at the selected campus',
    };
  }

  return { ok: true, program, campus };
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
