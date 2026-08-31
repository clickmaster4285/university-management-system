import { PlatformRole } from '../models/index.js';
import {
  DEFAULT_MODULE_ACCESS,
  PLATFORM_ROLES,
  ROLE_DESCRIPTIONS,
} from '../utils/moduleAccessDefaults.js';

export const seedPlatformRoles = async () => {
  try {
    const existing = await PlatformRole.countDocuments({ isDeleted: { $ne: true } });
    if (existing > 0) {
      console.info(`✅ Platform roles already seeded (${existing} roles)`);
      return;
    }

    const roles = PLATFORM_ROLES.map((name) => ({
      name,
      description: ROLE_DESCRIPTIONS[name] || '',
      moduleAccess: DEFAULT_MODULE_ACCESS[name] || {},
      isSystem: true,
    }));

    await PlatformRole.insertMany(roles);
    console.info(`✅ Seeded ${roles.length} platform roles`);
  } catch (error) {
    console.error('❌ Failed to seed platform roles:', error);
    throw error;
  }
};
