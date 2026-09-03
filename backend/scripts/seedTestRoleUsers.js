import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User, PlatformRole } from '../models/index.js';
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
  for (const roleName of PLATFORM_ROLES) {
    if (SKIP_ROLES.has(roleName)) continue;

    const email = roleToEmail(roleName);
    const existing = await User.findOne({ email });
    if (existing) continue;

    const platformRole = await PlatformRole.findOne({ name: roleName, isDeleted: { $ne: true } });
    if (!platformRole) continue;

    const moduleAccess = await getModuleAccessForRole(roleName);
    const password = roleToPassword(roleName);
    const hashedPassword = await bcrypt.hash(password, 10);
    const [firstName, ...rest] = roleName.split(' ');
    const lastName = rest.join(' ') || 'User';

    await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: mapPrimaryRoleToLegacyRole(roleName),
      platformRole: platformRole._id,
      moduleAccess,
      status: 'Active',
    });

    created += 1;
    console.info(`✅ Seeded test user: ${email} (${roleName}) / ${password}`);
  }

  if (created > 0) {
    console.info(`✅ Created ${created} test role user(s)`);
  }
};

export default seedTestRoleUsers;
