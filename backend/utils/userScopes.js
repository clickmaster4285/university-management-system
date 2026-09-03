import { RoleAssignment } from '../models/index.js';
import { getPlatformRoleName } from './userPlatformRole.js';

const GLOBAL_PRIMARY_ROLES = new Set([
  'System Admin',
  'University Admin',
  'Academic Admin',
  'Admin',
]);

const GLOBAL_LEGACY_ROLES = new Set(['Admin']);

export async function loadUserScopes(user) {
  const empty = {
    isGlobal: false,
    staffMemberId: user?.staffMemberId?.toString() || null,
    departmentIds: [],
    programIds: [],
    facultyIds: [],
    campusIds: [],
    roleTypes: [],
    assignments: [],
  };

  if (!user) {
    return { ...empty, isGlobal: true };
  }

  const platformRoleName = getPlatformRoleName(user);
  if (GLOBAL_LEGACY_ROLES.has(user.role) || GLOBAL_PRIMARY_ROLES.has(platformRoleName)) {
    return { ...empty, isGlobal: true };
  }

  if (!user.staffMemberId) {
    return empty;
  }

  const assignments = await RoleAssignment.find({
    staffMemberId: user.staffMemberId,
    isDeleted: { $ne: true },
    $or: [{ endDate: null }, { endDate: { $gte: new Date() } }],
  }).lean();

  const scopes = { ...empty, assignments };

  for (const assignment of assignments) {
    scopes.roleTypes.push(assignment.roleType);
    const scopeId = assignment.scopeId?.toString();
    if (!scopeId) continue;

    switch (assignment.scopeType) {
      case 'Department':
        scopes.departmentIds.push(scopeId);
        break;
      case 'Program':
        scopes.programIds.push(scopeId);
        break;
      case 'Faculty':
        scopes.facultyIds.push(scopeId);
        break;
      case 'Campus':
        scopes.campusIds.push(scopeId);
        break;
      default:
        break;
    }
  }

  return scopes;
}

export function userHasDepartmentScope(scopes, departmentId) {
  if (!departmentId) return false;
  if (scopes.isGlobal) return true;
  return scopes.departmentIds.includes(departmentId.toString());
}

export function userCanManageAllOfferings(scopes, user) {
  if (scopes.isGlobal) return true;
  if (user?.role === 'Staff' && scopes.departmentIds.length > 0) return true;
  if (scopes.roleTypes.includes('HOD') && scopes.departmentIds.length > 0) return true;
  return false;
}

export function userIsFacultyOnly(scopes, user) {
  if (scopes.isGlobal) return false;
  const facultyRole =
    user?.role === 'Teacher' ||
    getPlatformRoleName(user) === 'Faculty' ||
    scopes.roleTypes.length === 0;
  return facultyRole && Boolean(scopes.staffMemberId);
}
