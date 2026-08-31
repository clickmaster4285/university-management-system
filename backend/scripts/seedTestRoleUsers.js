import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { PLATFORM_ROLES, mapPrimaryRoleToLegacyRole } from '../utils/moduleAccessDefaults.js';
import { getModuleAccessForRole } from '../utils/platformRoleAccess.js';

dotenv.config();

const roleToEmail = (roleName) =>
  `${roleName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}@scholaros.test`;

const roleToPassword = (roleName) =>
  `${roleName.replace(/[^a-zA-Z0-9]+/g, '')}@123`;

const SKIP_ROLES = new Set(['System Admin', 'Student']);

export const seedTestRoleUsers = async () => {
  if (process.env.SEED_TEST_USERS !== 'true') {
    return;
  }

  let created = 0;
  for (const primaryRole of PLATFORM_ROLES) {
    if (SKIP_ROLES.has(primaryRole)) continue;

    const email = roleToEmail(primaryRole);
    const existing = await User.findOne({ email });
    if (existing) continue;

    const moduleAccess = await getModuleAccessForRole(primaryRole);
    const password = roleToPassword(primaryRole);
    const hashedPassword = await bcrypt.hash(password, 10);
    const [firstName, ...rest] = primaryRole.split(' ');
    const lastName = rest.join(' ') || 'User';

    await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: mapPrimaryRoleToLegacyRole(primaryRole),
      primaryRole,
      moduleAccess,
      status: 'Active',
    });

    created += 1;
    console.info(`✅ Seeded test user: ${email} (${primaryRole}) / ${password}`);
  }

  if (created > 0) {
    console.info(`✅ Created ${created} test role user(s)`);
  }
};

export default seedTestRoleUsers;
