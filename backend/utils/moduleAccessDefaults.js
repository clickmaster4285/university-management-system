export const MODULE_KEYS = [
  'dashboard',
  'governance',
  'academic_catalog',
  'academic_ops',
  'assessments',
  'admissions',
  'students',
  'staff',
  'library',
  'hostel',
  'transport',
  'events',
  'finance',
  'hr',
  'reports',
  'settings',
];

export const PLATFORM_ROLES = [
  'System Admin',
  'University Admin',
  'Academic Admin',
  'Department Head',
  'Faculty',
  'Examination',
  'Admissions',
  'Finance',
  'HR',
  'Student Affairs',
  'Librarian',
  'Transport',
  'Hostel',
  'Campus Ops',
  'Student',
];

const allModules = () =>
  MODULE_KEYS.reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {});

const pick = (...keys) =>
  MODULE_KEYS.reduce((acc, key) => {
    acc[key] = keys.includes(key);
    return acc;
  }, {});

export const DEFAULT_MODULE_ACCESS = {
  'System Admin': allModules(),
  'University Admin': pick(
    'dashboard',
    'governance',
    'academic_catalog',
    'academic_ops',
    'assessments',
    'admissions',
    'students',
    'staff',
    'library',
    'hostel',
    'transport',
    'events',
    'finance',
    'hr',
    'reports'
  ),
  'Academic Admin': pick(
    'dashboard',
    'governance',
    'academic_catalog',
    'academic_ops',
    'assessments',
    'students',
    'staff',
    'reports'
  ),
  'Department Head': pick('dashboard', 'academic_ops', 'assessments', 'students', 'staff'),
  Faculty: pick('dashboard', 'academic_ops', 'assessments', 'staff'),
  Examination: pick('dashboard', 'assessments', 'academic_ops', 'students'),
  Admissions: pick('dashboard', 'admissions', 'students'),
  Finance: pick('dashboard', 'finance', 'reports'),
  HR: pick('dashboard', 'staff', 'hr'),
  'Student Affairs': pick('dashboard', 'students', 'events'),
  Librarian: pick('dashboard', 'library'),
  Transport: pick('dashboard', 'transport'),
  Hostel: pick('dashboard', 'hostel'),
  'Campus Ops': pick('dashboard', 'events'),
  Student: pick('dashboard'),
};

export const MODULE_LABELS = {
  dashboard: 'Dashboard & Overview',
  governance: 'Governance',
  academic_catalog: 'Academic Catalog',
  academic_ops: 'Academic Operations',
  assessments: 'Assessments',
  admissions: 'Admissions',
  students: 'Students',
  staff: 'Staff',
  library: 'Library',
  hostel: 'Hostel',
  transport: 'Transport',
  events: 'Events',
  finance: 'Finance',
  hr: 'Human Resources',
  reports: 'Reports',
  settings: 'Settings',
};

export const ROLE_DESCRIPTIONS = {
  'System Admin': 'Full access including settings',
  'University Admin': 'Registrar / VC office — broad access',
  'Academic Admin': 'Academic structure, programs, sessions, offerings',
  'Department Head': 'Department-scoped academics and staff view',
  Faculty: 'Teaching staff — own offerings and assessments',
  Examination: 'Exam controller — exams and academic read',
  Admissions: 'Admissions office — student intake',
  Finance: 'Accounts / bursar — fees and finance',
  HR: 'HR office — staff and payroll',
  'Student Affairs': 'Student welfare and events',
  Librarian: 'Library module',
  Transport: 'Transport module',
  Hostel: 'Hostel module',
  'Campus Ops': 'Events and campus operations',
  Student: 'Student portal (future)',
};

export const serializeModuleAccess = (moduleAccess) => {
  if (!moduleAccess) return {};
  if (moduleAccess instanceof Map) {
    return Object.fromEntries(moduleAccess.entries());
  }
  return { ...moduleAccess };
};

/** Map expanded platform role to legacy JWT role */
export const mapPrimaryRoleToLegacyRole = (primaryRole) => {
  switch (primaryRole) {
    case 'System Admin':
    case 'University Admin':
    case 'Academic Admin':
    case 'Department Head':
      return 'Admin';
    case 'Faculty':
    case 'Examination':
      return 'Teacher';
    case 'Student':
      return 'Student';
    default:
      return 'Staff';
  }
};

export const resolveModuleAccess = (primaryRole, overrides = {}) => {
  const defaults = DEFAULT_MODULE_ACCESS[primaryRole] || DEFAULT_MODULE_ACCESS.Faculty;
  return { ...defaults, ...overrides };
};
