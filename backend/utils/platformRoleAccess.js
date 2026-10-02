import { PlatformRole } from '../models/index.js';
import { resolveModuleAccess, serializeModuleAccess } from './moduleAccessDefaults.js';

export async function getModuleAccessForRole(primaryRole, overrides = {}) {
  const role = await PlatformRole.findOne({ name: primaryRole, isDeleted: { $ne: true } });
  if (role) {
    return { ...serializeModuleAccess(role.moduleAccess), ...overrides };
  }
  return resolveModuleAccess(primaryRole, overrides);
}
