/**
 * Maps API mount paths to module keys for requireModule middleware.
 * Keep in sync with frontend src/lib/routeModules.ts
 */
export const API_ROUTE_MODULES = {
  '/students': 'students',
  '/departments': 'governance',
  '/offerings': 'academic_ops',
  '/program-semester-fees': 'finance',
  '/semester-registrations': 'academic_ops',
  '/programs': 'academic_catalog',
  '/platform-roles': 'settings',
  '/subjects': 'academic_catalog',
  '/attendance': 'assessments',
  '/admissions': 'admissions',
  '/assignments': 'assessments',
  '/exams': 'assessments',
  '/faculties': 'governance',
  '/books': 'library',
  '/transport': 'transport',
  '/events': 'events',
  '/challans': 'finance',
  '/finance': 'finance',
  '/payroll': 'finance',
  '/reports': 'reports',
  '/dashboard': 'dashboard',
  '/notifications': 'dashboard',
  '/settings': 'settings',
  '/staff': 'staff',
  '/workforce': 'hr',
  '/role-assignments': 'academic_ops',
  '/academic-sessions': 'academic_ops',
  '/batches': 'academic_ops',
  '/universities': 'governance',
  '/campuses': 'governance',
};

export const getModuleForApiPath = (mountPath) => API_ROUTE_MODULES[mountPath] || null;
