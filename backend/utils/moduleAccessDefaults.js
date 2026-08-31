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
