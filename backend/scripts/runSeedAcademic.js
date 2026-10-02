import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import { courseData } from './seedData/academicCatalog.data.js';
import { SEED_STRUCTURE } from './seedData/academicStructure.data.js';
import {
  seedAcademicStructure,
  printAcademicSeedReport,
} from '../utils/seedAcademicStructure.js';

dotenv.config();

const dryRun = process.argv.includes('--dry-run');
const verbose = process.argv.includes('--verbose');

try {
  await connectDB();

  console.log('Seeding academic structure (new model)...');
  console.log('University → Campus → Faculty → Department → Program → Subject → Curriculum → Fees\n');

  if (dryRun) {
    console.log('Dry-run mode — no database writes.\n');
  }

  const stats = await seedAcademicStructure({
    structure: SEED_STRUCTURE,
    catalogEntries: courseData,
    dryRun,
  });

  if (verbose) {
    console.log(`Catalog entries processed: ${courseData.length}`);
  }

  printAcademicSeedReport(stats, { dryRun });

  if (dryRun) {
    console.log('Re-run without --dry-run to apply: npm run seed:academic\n');
  } else {
    console.log('Academic seed complete.\n');
  }
} catch (err) {
  console.error('Academic seed failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
