import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import connectDB from '../config/database.js';
import { PlatformRole } from '../models/index.js';
import { reseedPlatformRolesData } from '../utils/reseedPlatformRoles.js';

dotenv.config();

export const seedPlatformRoles = async () => {
  try {
    const existing = await PlatformRole.countDocuments({ isDeleted: { $ne: true } });
    if (existing > 0) {
      console.info(`✅ Platform roles already seeded (${existing} roles)`);
      return;
    }

    const result = await reseedPlatformRolesData({ mode: 'missing' });
    console.info(`✅ Seeded ${result.created} platform roles`);
  } catch (error) {
    console.error('❌ Failed to seed platform roles:', error);
    throw error;
  }
};

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const mode = process.argv.includes('--reset') ? 'reset' : 'missing';

  try {
    await connectDB();
    const result = await reseedPlatformRolesData({ mode });
    console.info(`✅ ${result.message}`);
    if (mode === 'reset') {
      console.info(`   Updated: ${result.updated}`);
    } else {
      console.info(`   Created: ${result.created}, restored: ${result.restored}`);
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed platform roles:', error);
    process.exit(1);
  }
}
