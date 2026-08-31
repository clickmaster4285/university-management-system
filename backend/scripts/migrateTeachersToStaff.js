import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import { Faculty, CourseOffering, Department, StaffMember, User } from '../models/index.js';
import { generateStaffId } from '../utils/generateStaffId.js';

dotenv.config();

const legacyTeacherSchema = new mongoose.Schema({}, { strict: false, collection: 'teachers' });
const LegacyTeacher =
  mongoose.models.LegacyTeacher || mongoose.model('LegacyTeacher', legacyTeacherSchema);

const splitName = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || 'Staff',
    lastName: parts.slice(1).join(' '),
  };
};

const mapTeacherStatus = (status) => {
  if (['Active', 'On Leave', 'Resigned', 'Terminated', 'Retired'].includes(status)) {
    return status;
  }
  return 'Active';
};

async function migrateTeachers() {
  await connectDB();

  const teachers = await LegacyTeacher.find({ isDeleted: { $ne: true } });
  const idMap = new Map();
  let created = 0;
  let skipped = 0;

  for (const teacher of teachers) {
    const email = (teacher.email || `${teacher.teacherId || teacher._id}@migrated.local`).toLowerCase();

    let staff = await StaffMember.findOne({
      $or: [{ email }, ...(teacher.userId ? [{ userId: teacher.userId }] : [])],
      isDeleted: { $ne: true },
    });

    if (!staff) {
      const { firstName, lastName } = splitName(teacher.name);
      staff = await StaffMember.create({
        staffId: teacher.teacherId?.startsWith('FAC-')
          ? teacher.teacherId.replace('FAC-', 'STF-')
          : await generateStaffId(),
        userId: teacher.userId || null,
        firstName,
        lastName,
        email,
        phone: teacher.phone || '',
        status: mapTeacherStatus(teacher.status),
        isAcademic: true,
        employments: [
          {
            departmentId: teacher.departmentId,
            designation: teacher.designation,
            employmentType: 'Full-time',
            isPrimary: true,
            startDate: teacher.joiningDate || new Date(),
          },
        ],
        teacherProfile: {
          specialization: teacher.specialization || '',
          officeHours: teacher.officeHours || '',
          qualifications: (teacher.qualifications || []).map((q) => ({
            degree: q.degree,
            institution: q.institution,
            year: q.year,
            field: q.specialization,
          })),
        },
      });
      created += 1;
    } else {
      skipped += 1;
      if (!staff.userId && teacher.userId) {
        staff.userId = teacher.userId;
        await staff.save();
      }
    }

    idMap.set(teacher._id.toString(), staff._id);

    if (teacher.userId) {
      await User.updateOne({ _id: teacher.userId }, { $set: { staffMemberId: staff._id } });
    }
  }

  for (const [oldId, newId] of idMap.entries()) {
    await CourseOffering.updateMany({ instructorId: oldId }, { $set: { instructorId: newId } });
    await Department.updateMany({ headId: oldId }, { $set: { headId: newId } });
    await Faculty.updateMany({ headId: oldId }, { $set: { headId: newId } });
  }

  const teacherResult = await LegacyTeacher.updateMany(
    { isDeleted: { $ne: true } },
    { $set: { isDeleted: true, deletedAt: new Date() } }
  );

  console.log('Teacher migration complete');
  console.log(`Teachers found: ${teachers.length}`);
  console.log(`Staff created: ${created}`);
  console.log(`Staff reused: ${skipped}`);
  console.log(`Reference updates: ${idMap.size}`);
  console.log(`Teachers soft-deleted: ${teacherResult.modifiedCount}`);

  await mongoose.disconnect();
}

migrateTeachers().catch(async (error) => {
  console.error('Teacher migration failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
