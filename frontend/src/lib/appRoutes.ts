/**
 * Single source of truth for app route paths and settings navigation.
 * Import paths from here — do not hardcode `/settings/...` in pages or sidebar.
 */

export const APP_ROUTES = {
  dashboard: "/dashboard",
  settings: {
    index: "/settings",
    profile: "/settings/profile",
    roles: "/settings/roles",
    permissionAudit: "/settings/permission-audit",
  },
  /** Legacy paths that redirect elsewhere */
  legacy: {
    accessRoles: "/access/roles",
  },
} as const;

/** Redirect old paths → canonical paths */
export const ROUTE_REDIRECTS: Record<string, string> = {
  [APP_ROUTES.legacy.accessRoles]: APP_ROUTES.settings.roles,
};

export type SettingsPageKey = "index" | "profile" | "roles" | "permissionAudit";

export type SettingsNavItem = {
  key: SettingsPageKey;
  path: string;
  sidebarLabel: string;
  module: string;
  exact?: boolean;
  /** Shown on /settings hub cards; omit for items not linked from the hub */
  hubTitle?: string;
  hubDescription?: string;
};

/** Settings section — sidebar + hub cards derive from this */
export const SETTINGS_NAV: SettingsNavItem[] = [
  {
    key: "index",
    path: APP_ROUTES.settings.index,
    sidebarLabel: "Configuration",
    module: "settings",
    exact: true,
  },
  {
    key: "profile",
    path: APP_ROUTES.settings.profile,
    sidebarLabel: "Admin Profile",
    module: "settings",
    hubTitle: "Admin profile",
    hubDescription: "Your account details, password, and personal preferences.",
  },
  {
    key: "roles",
    path: APP_ROUTES.settings.roles,
    sidebarLabel: "Roles & Permissions",
    module: "settings",
    hubTitle: "Roles & permissions",
    hubDescription:
      "Platform roles, module access templates, seed defaults, and apply to users.",
  },
  {
    key: "permissionAudit",
    path: APP_ROUTES.settings.permissionAudit,
    sidebarLabel: "Permission Audit",
    module: "settings",
  },
];

export const SETTINGS_HUB_ITEMS = SETTINGS_NAV.filter(
  (item): item is SettingsNavItem & { hubTitle: string; hubDescription: string } =>
    Boolean(item.hubTitle && item.hubDescription)
);

export type SidebarNavItemConfig = {
  to: string;
  label: string;
  module: string;
  exact?: boolean;
};

export type SidebarNavSectionConfig = {
  label: string;
  items: SidebarNavItemConfig[];
};

/** Single source of truth for sidebar links — icons are mapped in sidebar.tsx */
export const SIDEBAR_NAV: SidebarNavSectionConfig[] = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", module: "dashboard", exact: true },
      { to: "/notifications", label: "Notifications", module: "dashboard" },
      { to: "/ai", label: "AI Assistant", module: "dashboard" },
    ],
  },
  {
    label: "Governance",
    items: [
      { to: "/university", label: "University", module: "governance" },
      { to: "/campuses", label: "Campuses", module: "governance" },
      { to: "/faculties", label: "Faculties", module: "governance" },
      { to: "/departments", label: "Departments", module: "governance" },
    ],
  },
  {
    label: "Academic Catalog",
    items: [
      { to: "/programs", label: "Programs", module: "academic_catalog" },
      { to: "/subjects", label: "Subjects", module: "academic_catalog" },
    ],
  },
  {
    label: "HR & Staff",
    items: [
      { to: "/staff", label: "Staff Directory", module: "staff" },
      { to: "/workforce", label: "Workforce", module: "hr" },
      { to: "/workforce/leaves", label: "Leave Management", module: "hr" },
      { to: "/workforce/attendance", label: "Staff Attendance", module: "hr" },
      { to: "/workforce/recruitment", label: "Recruitment", module: "hr" },
      { to: "/access", label: "Portal Access", module: "staff" },
      { to: "/role-assignments", label: "Role Assignments", module: "academic_ops" },
    ],
  },
  {
    label: "Students",
    items: [
      { to: "/admissions", label: "Applications", module: "admissions" },
      { to: "/students", label: "Student Directory", module: "students" },
    ],
  },
  {
    label: "Academic Operations",
    items: [
      { to: "/academic-sessions", label: "Sessions", module: "academic_ops" },
      { to: "/batches", label: "Batches", module: "academic_ops" },
      { to: "/offerings", label: "Offerings", module: "academic_ops" },
      { to: "/semester-registrations", label: "Registrations", module: "academic_ops" },
    ],
  },
  {
    label: "Assessments",
    items: [
      { to: "/attendance", label: "Attendance", module: "assessments" },
      { to: "/assignments", label: "Assignments", module: "assessments" },
      { to: "/exams", label: "Exam Grades", module: "assessments" },
      { to: "/online-classes", label: "Online Classes", module: "assessments" },
    ],
  },
  {
    label: "Campus Services",
    items: [
      { to: "/library", label: "Library", module: "library" },
      { to: "/hostel", label: "Hostel", module: "hostel" },
      { to: "/transport", label: "Transport", module: "transport" },
      { to: "/events", label: "Events", module: "events" },
      { to: "/qr", label: "Smart QR", module: "events" },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/payroll", label: "Payroll", module: "finance" },
      { to: "/challans", label: "Challans", module: "finance" },
      { to: "/finance", label: "Finance", module: "finance" },
      { to: "/reports", label: "Reports", module: "reports" },
    ],
  },
  {
    label: "Settings & Configuration",
    items: SETTINGS_NAV.map((item) => ({
      to: item.path,
      label: item.sidebarLabel,
      module: item.module,
      exact: item.exact,
    })),
  },
];

export type RolePermissionItem = {
  key: string;
  label: string;
  moduleKey: string;
  path: string;
};

export type RolePermissionSection = {
  label: string;
  items: RolePermissionItem[];
};

/** Roles UI — mirrors every sidebar link, grouped by sidebar section */
export const ROLE_PERMISSION_SECTIONS: RolePermissionSection[] = SIDEBAR_NAV.map((section) => ({
  label: section.label,
  items: section.items.map((item) => ({
    key: item.to,
    label: item.label,
    moduleKey: item.module,
    path: item.to,
  })),
}));

export const ROUTE_MODULE_MAP: Record<string, string> = SIDEBAR_NAV.flatMap((section) =>
  section.items.map((item) => [item.to, item.module] as const)
).reduce<Record<string, string>>((acc, [path, module]) => {
  acc[path] = module;
  return acc;
}, {});

export const getModuleForPath = (pathname: string): string | null => {
  const path = pathname.replace(/\/+$/, "") || "/";
  const exact = ROUTE_MODULE_MAP[path];
  if (exact) return exact;

  const sorted = Object.keys(ROUTE_MODULE_MAP).sort((a, b) => b.length - a.length);
  for (const route of sorted) {
    if (route !== "/" && (path === route || path.startsWith(`${route}/`))) {
      return ROUTE_MODULE_MAP[route];
    }
  }
  return null;
};

/** @deprecated Use ROLE_PERMISSION_SECTIONS — kept for legacy imports */
export const MODULE_GROUPS = ROLE_PERMISSION_SECTIONS.map((section) => ({
  label: section.label,
  keys: [...new Set(section.items.map((item) => item.moduleKey))],
}));

export const hasModuleAccess = (
  moduleAccess: Record<string, boolean> | undefined,
  moduleKey: string,
  primaryRole?: string
) => {
  if (primaryRole === "System Admin") return true;
  if (!moduleAccess || Object.keys(moduleAccess).length === 0) return true;
  return moduleAccess[moduleKey] === true;
};
