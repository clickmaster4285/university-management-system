import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import { seedDefaultAdmin } from './seedAdmin.js';
import { seedPlatformRoles } from './seedPlatformRoles.js';
import { seedAcademicStructure } from '../utils/seedAcademicStructure.js';
import { printAcademicSeedReport } from '../utils/seedAcademicStructure.js';
import { seedStaffAndStudents } from './seedStaffAndStudents.js';
import { seedTestRoleUsers } from './seedTestRoleUsers.js';
import { SEED_STRUCTURE } from './seedData/academicStructure.data.js';
import { courseData } from './seedData/academicCatalog.data.js';

dotenv.config();

const steps = [
  { key: 'platformRoles', label: 'Platform roles', run: seedPlatformRoles },
  { key: 'admin', label: 'Default admin', run: seedDefaultAdmin },
  {
    key: 'academic',
    label: 'Academic structure',
    run: async () => {
      const stats = await seedAcademicStructure({
        structure: SEED_STRUCTURE,
        catalogEntries: courseData,
        dryRun: false,
      });
      printAcademicSeedReport(stats, { dryRun: false });
    },
  },
  { key: 'staffAndStudents', label: 'Staff & students', run: seedStaffAndStudents },
  { key: 'testUsers', label: 'Test role users', run: seedTestRoleUsers },
];

async function main() {
  console.log('🌱 Master seed starting...\n');

  try {
    await connectDB();
    console.log('🔌 Connected to MongoDB\n');

    for (const step of steps) {
      console.log(`─`.repeat(60));
      console.log(`▶ ${step.label}`);
      console.log(`─`.repeat(60));
      try {
        await step.run();
        console.log(`✅ ${step.label} done\n`);
      } catch (err) {
        console.error(`❌ ${step.label} failed:`, err.message);
        throw err;
      }
    }

    console.log('═'.repeat(60));
    console.log('✅ Master seed completed successfully');
    console.log('═'.repeat(60));
  } catch (err) {
    console.error('\n❌ Master seed aborted:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

main();
