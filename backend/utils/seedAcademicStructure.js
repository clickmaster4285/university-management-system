import mongoose from 'mongoose';
import {
  University,
  Campus,
  Faculty,
  Department,
  Program,
  Subject,
  ProgramCurriculum,
  SubjectFeeHistory,
  User,
} from '../models/index.js';
import { generateUniversityId } from './generateUniversityId.js';
import { generateCampusId } from './generateCampusId.js';
import { generateFacultyId } from './generateFacultyId.js';
import { generateDepartmentId } from './generateDepartmentId.js';
import { generateProgramId } from './generateProgramId.js';
import { generateSubjectId } from './generateSubjectId.js';

const notDeleted = { $ne: true };

const dryId = (label) => new mongoose.Types.ObjectId();

async function nextUniqueFacultyId(campusId) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const facultyId = await generateFacultyId(campusId);
    const exists = await Faculty.findOne({ facultyId });
    if (!exists) return facultyId;
  }
  throw new Error('Unable to allocate a unique facultyId');
}

async function nextUniqueDepartmentCode(baseCode) {
  const normalized = baseCode.toUpperCase();
  const taken = await Department.findOne({ code: normalized, isDeleted: notDeleted });
  if (!taken) return normalized;

  for (let i = 2; i <= 20; i += 1) {
    const candidate = `${normalized}${i}`;
    const exists = await Department.findOne({ code: candidate, isDeleted: notDeleted });
    if (!exists) return candidate;
  }

  throw new Error(`Unable to allocate unique department code for ${baseCode}`);
}

function createStats() {
  return {
    university: { created: 0, reused: 0 },
    campus: { created: 0, reused: 0 },
    faculties: { created: 0, reused: 0 },
    departments: { created: 0, reused: 0 },
    programs: { created: 0, reused: 0 },
    subjects: { created: 0, reused: 0 },
    curriculum: { created: 0, reused: 0, updated: 0 },
    fees: { created: 0, reused: 0 },
    warnings: [],
    errors: [],
  };
}

function warn(stats, message) {
  stats.warnings.push(message);
}

async function ensureUniversity(config, stats, dryRun) {
  const existing = await University.findOne({ isDeleted: notDeleted });
  if (existing) {
    stats.university.reused += 1;
    return existing;
  }

  if (dryRun) {
    stats.university.created += 1;
    return { _id: dryId('university') };
  }

  const university = await University.create({
    universityId: await generateUniversityId(),
    universityName: config.universityName,
    universityCode: config.universityCode.toUpperCase(),
    shortName: config.shortName.toUpperCase(),
    universityType: config.universityType || 'Private',
    officialEmail: config.officialEmail.toLowerCase(),
    phoneNumber: config.phoneNumber || '',
    website: config.website || '',
    address: {
      country: config.country || 'Pakistan',
      province: config.province || '',
      city: config.city || '',
      street: config.address || '',
    },
    academicSettings: {
      academicSystem: 'Semester',
      gradingSystem: 'GPA',
      maxGPA: 4.0,
      passingGPA: 2.0,
    },
    status: 'Active',
  });

  await User.updateMany(
    { role: 'Admin', $or: [{ universityId: { $exists: false } }, { universityId: null }] },
    { $set: { universityId: university._id } }
  );

  stats.university.created += 1;
  return university;
}

async function ensureCampus(universityId, config, stats, dryRun) {
  const existing = await Campus.findOne({
    universityId,
    campusCode: config.campusCode.toUpperCase(),
    isDeleted: notDeleted,
  });

  if (existing) {
    stats.campus.reused += 1;
    return existing;
  }

  if (dryRun) {
    stats.campus.created += 1;
    return { _id: dryId('campus'), universityId };
  }

  const campus = await Campus.create({
    universityId,
    campusId: await generateCampusId(universityId),
    campusCode: config.campusCode.toUpperCase(),
    name: config.name,
    type: config.type || 'Main Campus',
    isMainCampus: config.isMainCampus ?? true,
    phone: config.phone || '',
    email: config.email || '',
    description: config.description || '',
    status: 'Active',
  });

  stats.campus.created += 1;
  return campus;
}

async function ensureFaculty(campusId, facultyConfig, stats, dryRun) {
  const existing = await Faculty.findOne({
    campusId,
    code: facultyConfig.code.toUpperCase(),
    isDeleted: notDeleted,
  });

  if (!existing) {
    const byName = await Faculty.findOne({
      campusId,
      name: facultyConfig.name,
      isDeleted: notDeleted,
    });
    if (byName) {
      stats.faculties.reused += 1;
      return byName;
    }
  }

  if (existing) {
    stats.faculties.reused += 1;
    return existing;
  }

  if (dryRun) {
    const existing = await Faculty.findOne({
      code: facultyConfig.code.toUpperCase(),
      isDeleted: notDeleted,
    });
    if (existing) {
      stats.faculties.reused += 1;
      return existing;
    }
    stats.faculties.created += 1;
    return { _id: dryId('faculty'), campusId };
  }

  const faculty = await Faculty.create({
    facultyId: await nextUniqueFacultyId(campusId),
    campusId,
    name: facultyConfig.name,
    code: facultyConfig.code.toUpperCase(),
    status: 'Active',
  });

  stats.faculties.created += 1;
  return faculty;
}

async function ensureDepartment(campusId, facultyId, deptConfig, stats, dryRun) {
  let existing = await Department.findOne({
    name: deptConfig.name,
    isDeleted: notDeleted,
  });

  if (!existing) {
    existing = await Department.findOne({
      campusId,
      code: deptConfig.code.toUpperCase(),
      isDeleted: notDeleted,
    });
  }

  if (!existing) {
    const firstWord = deptConfig.name.split(' ')[0];
    existing = await Department.findOne({
      name: { $regex: new RegExp(firstWord, 'i') },
      isDeleted: notDeleted,
    });
  }

  if (existing) {
    if (!existing.facultyId && facultyId && !dryRun) {
      existing.facultyId = facultyId;
      await existing.save();
    }
    stats.departments.reused += 1;
    return existing;
  }

  if (dryRun) {
    const existing = await Department.findOne({
      name: deptConfig.name,
      isDeleted: notDeleted,
    });
    if (existing) {
      stats.departments.reused += 1;
      return existing;
    }
    stats.departments.created += 1;
    return { _id: dryId('department'), campusId };
  }

  const department = await Department.create({
    departmentId: await generateDepartmentId(),
    campusId,
    facultyId: facultyId || null,
    name: deptConfig.name,
    code: await nextUniqueDepartmentCode(deptConfig.code),
    status: 'Active',
  });

  stats.departments.created += 1;
  return department;
}

async function ensureProgram(departmentId, programCode, programMeta, stats, dryRun) {
  const code = programCode.toUpperCase();
  const meta = programMeta[code] || {
    name: code,
    degreeLevel: code === 'BBA' ? 'BBA' : 'BS',
    duration: 8,
    totalCredits: 120,
  };

  const existing = await Program.findOne({ code, isDeleted: notDeleted });
  if (existing) {
    stats.programs.reused += 1;
    return existing;
  }

  if (dryRun) {
    const existing = await Program.findOne({ code, isDeleted: notDeleted });
    if (existing) {
      stats.programs.reused += 1;
      return existing;
    }
    stats.programs.created += 1;
    return { _id: dryId('program'), code };
  }

  const program = await Program.create({
    programId: await generateProgramId(),
    code,
    name: meta.name,
    departmentId,
    degreeLevel: meta.degreeLevel,
    duration: meta.duration,
    totalCredits: meta.totalCredits || 120,
    status: 'Active',
  });

  stats.programs.created += 1;
  return program;
}

async function ensureSubject(departmentId, entry, stats, dryRun) {
  const code = entry.code.toUpperCase();
  const existing = await Subject.findOne({ code, isDeleted: notDeleted });

  if (existing) {
    stats.subjects.reused += 1;
    return existing;
  }

  if (dryRun) {
    const existing = await Subject.findOne({ code, isDeleted: notDeleted });
    if (existing) {
      stats.subjects.reused += 1;
      return existing;
    }
    stats.subjects.created += 1;
    return { _id: dryId('subject'), code, credits: entry.credits };
  }

  const subject = await Subject.create({
    subjectId: await generateSubjectId(),
    code,
    name: entry.name,
    departmentId,
    credits: entry.credits || 3,
    description: `${entry.name} (${code})`,
    status: 'Active',
  });

  stats.subjects.created += 1;
  return subject;
}

async function ensureCurriculum(programId, subjectId, entry, order, stats, dryRun) {
  const existing = await ProgramCurriculum.findOne({
    programId,
    subjectId,
    isDeleted: notDeleted,
  });

  if (existing) {
    if (existing.semester !== entry.semester || existing.order !== order) {
      if (!dryRun) {
        existing.semester = entry.semester;
        existing.order = order;
        await existing.save();
      }
      stats.curriculum.updated += 1;
    } else {
      stats.curriculum.reused += 1;
    }
    return existing;
  }

  if (dryRun) {
    stats.curriculum.created += 1;
    return null;
  }

  await ProgramCurriculum.create({
    programId,
    subjectId,
    semester: entry.semester,
    type: 'Core',
    order,
    status: 'Active',
  });

  stats.curriculum.created += 1;
  return null;
}

async function ensureFee(subjectId, programId, entry, feeConfig, stats, dryRun) {
  const feePerCredit = Number(entry.feePerCredit);
  if (!Number.isFinite(feePerCredit) || feePerCredit < 0) return;

  const existing = await SubjectFeeHistory.findOne({
    subjectId,
    programId,
    effectiveTo: null,
  });

  if (existing) {
    stats.fees.reused += 1;
    return;
  }

  const seeded = await SubjectFeeHistory.findOne({
    subjectId,
    programId,
    reason: feeConfig.feeSeedReason,
  });

  if (seeded) {
    stats.fees.reused += 1;
    return;
  }

  if (dryRun) {
    stats.fees.created += 1;
    return;
  }

  await SubjectFeeHistory.create({
    subjectId,
    programId,
    feePerCredit,
    feeType: 'Tuition',
    effectiveFrom: new Date(feeConfig.feeEffectiveFrom),
    effectiveTo: null,
    reason: feeConfig.feeSeedReason,
  });

  stats.fees.created += 1;
}

export async function seedAcademicStructure({
  structure,
  catalogEntries,
  dryRun = false,
} = {}) {
  if (!structure || !catalogEntries?.length) {
    throw new Error('structure and catalogEntries are required');
  }

  const stats = createStats();

  const university = await ensureUniversity(structure.university, stats, dryRun);
  const campus = await ensureCampus(university._id, structure.campus, stats, dryRun);

  const departmentByName = new Map();
  const programByCode = new Map();

  for (const facultyConfig of structure.faculties) {
    const faculty = await ensureFaculty(campus._id, facultyConfig, stats, dryRun);

    for (const deptConfig of facultyConfig.departments) {
      const department = await ensureDepartment(
        campus._id,
        faculty._id,
        deptConfig,
        stats,
        dryRun
      );
      departmentByName.set(deptConfig.name, department);

      for (const programCode of deptConfig.programs) {
        const program = await ensureProgram(
          department._id,
          programCode,
          structure.programMeta,
          stats,
          dryRun
        );
        programByCode.set(programCode.toUpperCase(), program);
      }
    }
  }

  const semesterOrder = new Map();

  for (const entry of catalogEntries) {
    try {
      const department = departmentByName.get(entry.department);
      if (!department) {
        warn(stats, `No department "${entry.department}" for subject ${entry.code}`);
        continue;
      }

      const program = programByCode.get(String(entry.program || '').toUpperCase());
      if (!program) {
        warn(stats, `No program "${entry.program}" for subject ${entry.code}`);
        continue;
      }

      const subject = await ensureSubject(department._id, entry, stats, dryRun);

      const orderKey = `${program._id}:${entry.semester}`;
      const order = (semesterOrder.get(orderKey) || 0) + 1;
      semesterOrder.set(orderKey, order);

      await ensureCurriculum(program._id, subject._id, entry, order, stats, dryRun);
      await ensureFee(subject._id, program._id, entry, structure, stats, dryRun);
    } catch (err) {
      stats.errors.push(`${entry.code}: ${err.message}`);
    }
  }

  return stats;
}

export function printAcademicSeedReport(stats, { dryRun = false } = {}) {
  console.log('\n=== Academic structure seed ===');
  if (dryRun) console.log('Mode: DRY RUN (no writes)\n');

  const line = (label, bucket) =>
    console.log(`${label.padEnd(22)} created ${bucket.created}, reused ${bucket.reused}${bucket.updated !== undefined ? `, updated ${bucket.updated}` : ''}`);

  line('University', stats.university);
  line('Campus', stats.campus);
  line('Faculties', stats.faculties);
  line('Departments', stats.departments);
  line('Programs', stats.programs);
  line('Subjects', stats.subjects);
  line('Curriculum', stats.curriculum);
  line('Fees', stats.fees);

  if (stats.warnings.length) {
    console.log(`\nWarnings (${stats.warnings.length}):`);
    stats.warnings.slice(0, 10).forEach((w) => console.log(`  ⚠ ${w}`));
    if (stats.warnings.length > 10) {
      console.log(`  ... and ${stats.warnings.length - 10} more`);
    }
  }

  if (stats.errors.length) {
    console.log(`\nErrors (${stats.errors.length}):`);
    stats.errors.slice(0, 10).forEach((e) => console.log(`  ✗ ${e}`));
    if (stats.errors.length > 10) {
      console.log(`  ... and ${stats.errors.length - 10} more`);
    }
  }

  console.log('');
}
