import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {
  User,
  StaffMember,
  Student,
  University,
  Campus,
  Department,
  Program,
  Batch,
  AcademicSession,
  Counter,
} from '../models/index.js';

const PASSWORD_HASH = bcrypt.hashSync('password123', 10);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function generateStaffId() {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'staffId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return `STF-${String(counter.seq).padStart(4, '0')}`;
}

async function generateStudentId() {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'studentId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return `STU-${String(counter.seq).padStart(4, '0')}`;
}

async function findOrCreateModel(Model, filter, defaults) {
  let doc = await Model.findOne({ ...filter, isDeleted: { $ne: true } });
  if (!doc) {
    doc = await Model.create({ ...filter, ...defaults });
    console.log(`  ✓ Created ${Model.modelName}: ${doc.name || doc.universityName || doc.code || doc._id}`);
  } else {
    console.log(`  • Found ${Model.modelName}: ${doc.name || doc.universityName || doc.code || doc._id}`);
  }
  return doc;
}

// ---------------------------------------------------------------------------
// Seed data definitions
// ---------------------------------------------------------------------------

const TEACHERS = [
  {
    firstName: 'Ahmad',
    lastName: 'Khan',
    email: 'ahmad.khan@university.edu',
    cnic: '35201-1234567-1',
    gender: 'Male',
    phone: '+92-300-1234567',
    designation: 'Professor',
    departmentName: 'Computer Science',
    departmentCode: 'CS',
    isAcademic: true,
  },
  {
    firstName: 'Fatima',
    lastName: 'Ali',
    email: 'fatima.ali@university.edu',
    cnic: '35201-2345678-2',
    gender: 'Female',
    phone: '+92-301-2345678',
    designation: 'Associate Professor',
    departmentName: 'Software Engineering',
    departmentCode: 'SE',
    isAcademic: true,
  },
  {
    firstName: 'Hassan',
    lastName: 'Raza',
    email: 'hassan.raza@university.edu',
    cnic: '35201-3456789-3',
    gender: 'Male',
    phone: '+92-302-3456789',
    designation: 'Lecturer',
    departmentName: 'Mathematics',
    departmentCode: 'MATH',
    isAcademic: true,
  },
];

const STUDENTS = [
  {
    firstName: 'Ali',
    lastName: 'Muhammad',
    email: 'ali.muhammad@student.university.edu',
    phone: '+92-332-1111111',
    programName: 'Bachelor of Science in Computer Science',
    programCode: 'BSCS',
    semester: 3,
    fatherName: 'Muhammad Khan',
  },
  {
    firstName: 'Sara',
    lastName: 'Bibi',
    email: 'sara.bibi@student.university.edu',
    phone: '+92-333-2222222',
    programName: 'Bachelor of Science in Computer Science',
    programCode: 'BSCS',
    semester: 3,
    fatherName: 'Abdul Bibi',
  },
  {
    firstName: 'Usman',
    lastName: 'Ahmed',
    email: 'usman.ahmed@student.university.edu',
    phone: '+92-334-3333333',
    programName: 'Bachelor of Science in Software Engineering',
    programCode: 'BSSE',
    semester: 5,
    fatherName: 'Ahmed Shah',
  },
  {
    firstName: 'Ayesha',
    lastName: 'Noor',
    email: 'ayesha.noor@student.university.edu',
    phone: '+92-335-4444444',
    programName: 'Bachelor of Science in Computer Science',
    programCode: 'BSCS',
    semester: 1,
    fatherName: 'Noor Khan',
  },
  {
    firstName: 'Bilal',
    lastName: 'Shah',
    email: 'bilal.shah@student.university.edu',
    phone: '+92-336-5555555',
    programName: 'Bachelor of Science in Software Engineering',
    programCode: 'BSSE',
    semester: 1,
    fatherName: 'Shah Ali',
  },
];

const STAFF = [
  {
    firstName: 'Khan',
    lastName: 'Muhammad',
    email: 'khan.muhammad@university.edu',
    cnic: '35201-4567890-4',
    gender: 'Male',
    phone: '+92-340-4567890',
    designation: 'HR Manager',
    departmentName: 'Human Resources',
    departmentCode: 'HR',
  },
  {
    firstName: 'Zainab',
    lastName: 'Bibi',
    email: 'zainab.bibi@university.edu',
    cnic: '35201-5678901-5',
    gender: 'Female',
    phone: '+92-341-5678901',
    designation: 'HR Officer',
    departmentName: 'Human Resources',
    departmentCode: 'HR',
  },
  {
    firstName: 'Imran',
    lastName: 'Khan',
    email: 'imran.khan@university.edu',
    cnic: '35201-6789012-6',
    gender: 'Male',
    phone: '+92-342-6789012',
    designation: 'Accounts Officer',
    departmentName: 'Finance',
    departmentCode: 'FIN',
  },
  {
    firstName: 'Fatima',
    lastName: 'Zahra',
    email: 'fatima.zahra@university.edu',
    cnic: '35201-7890123-7',
    gender: 'Female',
    phone: '+92-343-7890123',
    designation: 'Librarian',
    departmentName: 'Library',
    departmentCode: 'LIB',
  },
  {
    firstName: 'Ali',
    lastName: 'Hassan',
    email: 'ali.hassan@university.edu',
    cnic: '35201-8901234-8',
    gender: 'Male',
    phone: '+92-344-8901234',
    designation: 'Transport Incharge',
    departmentName: 'Transport',
    departmentCode: 'TRN',
  },
];

// ---------------------------------------------------------------------------
// Main seed logic
// ---------------------------------------------------------------------------

export const seedStaffAndStudents = async () => {
  try {
    // ── 1. Connect ────────────────────────────────────────────────────────
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('🔌 Connected to MongoDB');
    }

    console.log('\n🏫 Seeding University Infrastructure...\n');

    // ── 2. University ─────────────────────────────────────────────────────
    const university = await findOrCreateModel(
      University,
      { universityName: 'National University of Science & Technology' },
      {
        universityId: 'UNI-0001',
        universityCode: 'NUST',
        shortName: 'NUST',
        universityType: 'Private',
        officialEmail: 'info@nust.edu',
        phoneNumber: '+92-51-1234567',
        website: 'https://www.nust.edu.pk',
        status: 'Active',
      },
    );

    // ── 3. Campuses ───────────────────────────────────────────────────────
    console.log('\n📍 Seeding Campuses...\n');

    const mainCampus = await findOrCreateModel(
      Campus,
      { universityId: university._id, campusCode: 'MAIN' },
      {
        campusId: 'CMP-0001',
        name: 'Main Campus',
        type: 'Main Campus',
        isMainCampus: true,
        address: { street: 'Sector H-12', city: 'Islamabad', province: 'Islamabad', country: 'Pakistan' },
        phone: '+92-51-1111111',
        email: 'main@nust.edu.pk',
        establishedYear: 1991,
        status: 'Active',
      },
    );

    const satelliteCampus = await findOrCreateModel(
      Campus,
      { universityId: university._id, campusCode: 'SAT' },
      {
        campusId: 'CMP-0002',
        name: 'Satellite Campus',
        type: 'Branch',
        isMainCampus: false,
        address: { street: 'Sector E-9', city: 'Islamabad', province: 'Islamabad', country: 'Pakistan' },
        phone: '+92-51-2222222',
        email: 'satellite@nust.edu.pk',
        establishedYear: 2010,
        status: 'Active',
      },
    );

    // ── 4. Departments ────────────────────────────────────────────────────
    console.log('\n🏛️  Seeding Departments...\n');

    const departmentDefs = [
      { name: 'Computer Science', code: 'CS', campusId: mainCampus._id },
      { name: 'Software Engineering', code: 'SE', campusId: mainCampus._id },
      { name: 'Mathematics', code: 'MATH', campusId: mainCampus._id },
      { name: 'Human Resources', code: 'HR', campusId: mainCampus._id },
      { name: 'Finance', code: 'FIN', campusId: mainCampus._id },
      { name: 'Library', code: 'LIB', campusId: mainCampus._id },
      { name: 'Transport', code: 'TRN', campusId: satelliteCampus._id },
    ];

    const departments = {};
    for (const def of departmentDefs) {
      const dept = await findOrCreateModel(
        Department,
        { campusId: def.campusId, code: def.code },
        { departmentId: `DEPT-${def.code}`, name: def.name, status: 'Active' },
      );
      departments[def.code] = dept;
    }

    // ── 5. Academic Session ───────────────────────────────────────────────
    console.log('\n📅 Seeding Academic Session...\n');

    const academicSession = await findOrCreateModel(
      AcademicSession,
      { name: 'Fall 2025' },
      {
        code: 'F25',
        startDate: new Date('2025-08-15'),
        endDate: new Date('2025-12-31'),
        status: 'Active',
        isCurrent: true,
      },
    );

    // ── 6. Programs ───────────────────────────────────────────────────────
    console.log('\n🎓 Seeding Programs...\n');

    const programDefs = [
      {
        name: 'Bachelor of Science in Computer Science',
        code: 'BSCS',
        departmentCode: 'CS',
        degreeLevel: 'BS',
        duration: 8,
        totalCredits: 130,
      },
      {
        name: 'Bachelor of Science in Software Engineering',
        code: 'BSSE',
        departmentCode: 'SE',
        degreeLevel: 'BS',
        duration: 8,
        totalCredits: 136,
      },
    ];

    const programs = {};
    for (const def of programDefs) {
      const program = await findOrCreateModel(
        Program,
        { code: def.code },
        {
          programId: `PRG-${def.code}`,
          name: def.name,
          departmentId: departments[def.departmentCode]._id,
          degreeLevel: def.degreeLevel,
          duration: def.duration,
          totalCredits: def.totalCredits,
          status: 'Active',
        },
      );
      programs[def.code] = program;
    }

    // ── 7. Batches ────────────────────────────────────────────────────────
    console.log('\n👥 Seeding Batches...\n');

    const batchDefs = [
      {
        year: 2023,
        code: 'BSCS-2023',
        departmentCode: 'CS',
        programCode: 'BSCS',
        admissionSemester: 'Fall',
        expectedGraduation: 2027,
      },
      {
        year: 2024,
        code: 'BSCS-2024',
        departmentCode: 'CS',
        programCode: 'BSCS',
        admissionSemester: 'Fall',
        expectedGraduation: 2028,
      },
      {
        year: 2023,
        code: 'BSSE-2023',
        departmentCode: 'SE',
        programCode: 'BSSE',
        admissionSemester: 'Fall',
        expectedGraduation: 2027,
      },
      {
        year: 2025,
        code: 'BSCS-2025',
        departmentCode: 'CS',
        programCode: 'BSCS',
        admissionSemester: 'Fall',
        expectedGraduation: 2029,
      },
      {
        year: 2025,
        code: 'BSSE-2025',
        departmentCode: 'SE',
        programCode: 'BSSE',
        admissionSemester: 'Fall',
        expectedGraduation: 2029,
      },
    ];

    const batches = {};
    for (const def of batchDefs) {
      const batch = await findOrCreateModel(
        Batch,
        { code: def.code },
        {
          year: def.year,
          department: departments[def.departmentCode].name,
          departmentId: departments[def.departmentCode]._id,
          program: programs[def.programCode].name,
          programId: programs[def.programCode].programId,
          admissionSession: academicSession.name,
          admissionSessionId: academicSession._id,
          admissionSemester: def.admissionSemester,
          expectedGraduation: def.expectedGraduation,
          status: 'Active',
        },
      );
      batches[def.code] = batch;
    }

    // ── 8. Users + Staff Members (Teachers & Staff) ───────────────────────
    console.log('\n👩‍🏫 Seeding Teachers & Staff Users...\n');

    const createdUsers = [];
    const createdStaffMembers = [];

    // --- Teachers ---
    for (const t of TEACHERS) {
      const existing = await User.findOne({ email: t.email, isDeleted: { $ne: true } });
      if (existing) {
        console.log(`  • Teacher already exists: ${t.email}`);
        createdUsers.push(existing);
        continue;
      }

      const user = await User.create({
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        password: PASSWORD_HASH,
        phoneNumber: t.phone,
        role: 'Teacher',
        universityId: university._id,
        status: 'Active',
      });

      const staffId = await generateStaffId();
      const staffMember = await StaffMember.create({
        staffId,
        userId: user._id,
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        phone: t.phone,
        cnic: t.cnic,
        gender: t.gender,
        isAcademic: true,
        status: 'Active',
        employments: [
          {
            departmentId: departments[t.departmentCode]._id,
            campusId: mainCampus._id,
            designation: t.designation,
            employmentType: 'Full-time',
            isPrimary: true,
            startDate: new Date('2020-01-01'),
          },
        ],
      });

      user.staffMemberId = staffMember._id;
      await user.save();

      createdUsers.push(user);
      createdStaffMembers.push(staffMember);
      console.log(`  ✓ Created Teacher: ${t.firstName} ${t.lastName} (${staffId})`);
    }

    // --- Staff (HR, Finance, Library, Transport) ---
    for (const s of STAFF) {
      const existing = await User.findOne({ email: s.email, isDeleted: { $ne: true } });
      if (existing) {
        console.log(`  • Staff already exists: ${s.email}`);
        createdUsers.push(existing);
        continue;
      }

      const user = await User.create({
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        password: PASSWORD_HASH,
        phoneNumber: s.phone,
        role: 'Staff',
        universityId: university._id,
        status: 'Active',
      });

      const staffId = await generateStaffId();
      const staffMember = await StaffMember.create({
        staffId,
        userId: user._id,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        phone: s.phone,
        cnic: s.cnic,
        gender: s.gender,
        isAcademic: false,
        status: 'Active',
        employments: [
          {
            departmentId: departments[s.departmentCode]._id,
            campusId: mainCampus._id,
            designation: s.designation,
            employmentType: 'Full-time',
            isPrimary: true,
            startDate: new Date('2021-06-01'),
          },
        ],
      });

      user.staffMemberId = staffMember._id;
      await user.save();

      createdUsers.push(user);
      createdStaffMembers.push(staffMember);
      console.log(`  ✓ Created Staff: ${s.firstName} ${s.lastName} (${staffId}) — ${s.designation}`);
    }

    // ── 9. Users + Students ───────────────────────────────────────────────
    console.log('\n🎓 Seeding Students...\n');

    const createdStudents = [];

    for (const s of STUDENTS) {
      const existing = await User.findOne({ email: s.email, isDeleted: { $ne: true } });
      if (existing) {
        console.log(`  • Student already exists: ${s.email}`);
        createdUsers.push(existing);
        continue;
      }

      const user = await User.create({
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        password: PASSWORD_HASH,
        phoneNumber: s.phone,
        role: 'Student',
        universityId: university._id,
        status: 'Active',
      });

      const program = programs[s.programCode];
      const deptCode = s.programCode === 'BSCS' ? 'CS' : 'SE';
      const dept = departments[deptCode];

      // Determine batch based on semester
      let batchCode;
      if (s.semester === 1) {
        batchCode = `${s.programCode}-2025`;
      } else if (s.semester <= 3) {
        batchCode = `${s.programCode}-2024`;
      } else {
        batchCode = `${s.programCode}-2023`;
      }
      const batch = batches[batchCode];

      const studentId = await generateStudentId();
      const student = await Student.create({
        studentId,
        userId: user._id,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        phone: s.phone,
        fatherName: s.fatherName,
        programId: program._id,
        departmentId: dept._id,
        campusId: mainCampus._id,
        batchId: batch._id,
        currentSemester: s.semester,
        semester: s.semester,
        status: 'Active',
        enrollmentDate: new Date('2025-08-15'),
        fee: 'Pending',
      });

      createdStudents.push(student);
      createdUsers.push(user);
      console.log(`  ✓ Created Student: ${s.firstName} ${s.lastName} (${studentId}) — ${s.programCode} Sem ${s.semester}`);
    }

    // ── Summary ───────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(60));
    console.log('📊 SEED SUMMARY');
    console.log('═'.repeat(60));
    console.log(`  University     : ${university.universityName}`);
    console.log(`  Campuses       : 2 (Main, Satellite)`);
    console.log(`  Departments    : ${Object.keys(departments).length}`);
    console.log(`  Programs       : ${Object.keys(programs).length}`);
    console.log(`  Batches        : ${Object.keys(batches).length}`);
    console.log(`  Academic Session: ${academicSession.name}`);
    console.log('─'.repeat(60));
    console.log(`  Teachers       : ${TEACHERS.length}`);
    console.log(`  Students       : ${STUDENTS.length}`);
    console.log(`  Staff          : ${STAFF.length}`);
    console.log(`  Total Users    : ${createdUsers.length}`);
    console.log('─'.repeat(60));
    console.log('  Default password for all accounts: password123');
    console.log('═'.repeat(60) + '\n');

    return {
      university,
      mainCampus,
      satelliteCampus,
      departments,
      programs,
      batches,
      academicSession,
      createdUsers,
      createdStaffMembers,
      createdStudents,
    };
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (process.argv[1] && process.argv[1].includes('seedStaffAndStudents')) {
  (async () => {
    try {
      await seedStaffAndStudents();
      console.log('✅ Seed completed successfully');
    } catch (err) {
      console.error('❌ Seed aborted:', err.message);
    } finally {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
      process.exit(0);
    }
  })();
}
