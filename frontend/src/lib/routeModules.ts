export const ROUTE_MODULE_MAP: Record<string, string> = {
  '/': 'dashboard',
  '/notifications': 'dashboard',
  '/ai': 'dashboard',
  '/university': 'governance',
  '/campuses': 'governance',
  '/faculties': 'governance',
  '/departments': 'governance',
  '/subjects': 'academic_catalog',
  '/programs': 'academic_catalog',
  '/staff': 'staff',
  '/workforce': 'hr',
  '/payroll': 'finance',
  '/access': 'staff',
  '/settings': 'settings',
  '/settings/profile': 'settings',
  '/settings/roles': 'settings',
  '/settings/permission-audit': 'settings',
  '/role-assignments': 'academic_ops',
  '/students': 'students',
  '/admissions': 'admissions',
  '/offerings': 'academic_ops',
  '/semester-registrations': 'academic_ops',
  '/batches': 'academic_ops',
  '/academic-sessions': 'academic_ops',
  '/attendance': 'assessments',
  '/assignments': 'assessments',
  '/exams': 'assessments',
  '/online-classes': 'assessments',
  '/library': 'library',
  '/hostel': 'hostel',
  '/transport': 'transport',
  '/events': 'events',
  '/qr': 'events',
  '/finance': 'finance',
  '/challans': 'finance',
  '/reports': 'reports',
};

export const getModuleForPath = (pathname: string): string | null => {
  const path = pathname.replace(/\/+$/, '') || '/';
  const exact = ROUTE_MODULE_MAP[path];
  if (exact) return exact;

  const sorted = Object.keys(ROUTE_MODULE_MAP).sort((a, b) => b.length - a.length);
  for (const route of sorted) {
    if (route !== '/' && (path === route || path.startsWith(`${route}/`))) {
      return ROUTE_MODULE_MAP[route];
    }
  }
  return null;
};

export const hasModuleAccess = (
  moduleAccess: Record<string, boolean> | undefined,
  moduleKey: string
) => {
  if (!moduleAccess || Object.keys(moduleAccess).length === 0) return true;
  return moduleAccess[moduleKey] === true;
};
