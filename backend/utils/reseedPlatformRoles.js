import { PlatformRole } from '../models/index.js';
import {
  DEFAULT_MODULE_ACCESS,
  PLATFORM_ROLES,
  ROLE_DESCRIPTIONS,
} from './moduleAccessDefaults.js';

const notDeleted = { $ne: true };

function buildRoleDefaults(name) {
  return {
    description: ROLE_DESCRIPTIONS[name] || '',
    moduleAccess: DEFAULT_MODULE_ACCESS[name] || {},
    isSystem: true,
  };
}

export async function reseedPlatformRolesData({ mode = 'missing' } = {}) {
  let created = 0;
  let updated = 0;
  let restored = 0;

  for (const name of PLATFORM_ROLES) {
    const defaults = buildRoleDefaults(name);
    const existing = await PlatformRole.findOne({ name });

    if (!existing) {
      await PlatformRole.create({ name, ...defaults });
      created += 1;
      continue;
    }

    if (existing.isDeleted) {
      existing.isDeleted = false;
      existing.deletedAt = null;
      existing.deletedBy = null;
      existing.description = defaults.description;
      existing.moduleAccess = defaults.moduleAccess;
      existing.isSystem = true;
      await existing.save();
      restored += 1;
      continue;
    }

    if (mode === 'reset') {
      existing.description = defaults.description;
      existing.moduleAccess = defaults.moduleAccess;
      existing.isSystem = true;
      await existing.save();
      updated += 1;
    }
  }

  const roles = await PlatformRole.find({ isDeleted: notDeleted }).sort({ name: 1 });

  return {
    roles,
    created,
    updated,
    restored,
    message:
      mode === 'reset'
        ? `Restored ${updated} system role(s) to defaults`
        : `Seeded ${created} missing system role(s)${restored ? `, restored ${restored} deleted role(s)` : ''}`,
  };
}
