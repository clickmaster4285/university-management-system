import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User, PlatformRole } from '../models/index.js';
import { DEFAULT_MODULE_ACCESS, serializeModuleAccess } from '../utils/moduleAccessDefaults.js';

dotenv.config();

export const seedDefaultAdmin = async () => {
  try {
    const firstName = process.env.ADMIN_FIRST_NAME;
    const lastName = process.env.ADMIN_LAST_NAME;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!firstName || !lastName || !email || !password) {
      throw new Error('ADMIN_FIRST_NAME, ADMIN_LAST_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be configured');
    }

    const systemRole = await PlatformRole.findOne({ name: 'System Admin', isDeleted: { $ne: true } });
    if (!systemRole) {
      throw new Error('System Admin platform role not found — seed platform roles first');
    }

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      const access = serializeModuleAccess(existingAdmin.moduleAccess);
      const shouldSyncSystemAdmin =
        existingAdmin.platformRole?.toString() === systemRole._id.toString() && access.settings !== true;
      const shouldInitialize = !existingAdmin.platformRole || !existingAdmin.moduleAccess?.size;

      if (shouldInitialize || shouldSyncSystemAdmin) {
        existingAdmin.role = 'Admin';
        existingAdmin.platformRole = systemRole._id;
        existingAdmin.moduleAccess = DEFAULT_MODULE_ACCESS['System Admin'];
        await existingAdmin.save();
        console.info(`✅ System Admin permissions synced: ${email}`);
      } else {
        console.info(`✅ Admin user already exists: ${email}`);
      }
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'Admin',
      platformRole: systemRole._id,
      moduleAccess: DEFAULT_MODULE_ACCESS['System Admin'],
      status: 'Active',
    });

    console.info(`✅ Admin user seeded: ${email}`);
  } catch (error) {
    console.error('❌ Failed to seed default admin:', error);
    throw error;
  }
};
