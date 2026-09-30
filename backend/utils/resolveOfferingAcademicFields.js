import mongoose from 'mongoose';
import { CourseOffering } from '../models/index.js';

/**
 * Load a CourseOffering and return denormalized academic fields for
 * Assignment / Exam / Attendance create+update.
 * @param {string} offeringMongoId - CourseOffering._id
 * @returns {Promise<object|null>}
 */
export async function resolveOfferingAcademicFields(offeringMongoId) {
  if (!offeringMongoId || !mongoose.Types.ObjectId.isValid(offeringMongoId)) {
    return null;
  }

  const offering = await CourseOffering.findOne({
    _id: offeringMongoId,
    isDeleted: { $ne: true },
  })
    .populate({
      path: 'subjectId',
      select: 'name code departmentId',
      populate: { path: 'departmentId', select: 'name code' },
    })
    .populate('programId', 'name code')
    .populate('batchId', 'code year')
    .populate('academicSessionId', 'name code')
    .populate('instructorId', 'firstName lastName name email');

  if (!offering) return null;

  const subject = offering.subjectId;
  const program = offering.programId;
  const session = offering.academicSessionId;
  const instructor = offering.instructorId;
  const department = subject?.departmentId;

  let instructorName = '';
  if (instructor) {
    instructorName = instructor.name
      || `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim();
  }

  return {
    offeringId: offering._id,
    subjectId: subject?._id || offering.subjectId,
    programId: program?._id || offering.programId,
    batchId: offering.batchId?._id || offering.batchId,
    academicSessionId: session?._id || offering.academicSessionId,
    semester: offering.semester,
    course: subject?.name || '',
    courseCode: subject?.code || '',
    department: department?.name || department?.code || '',
    program: program?.name || program?.code || '',
    academicYear: session?.name || session?.code || '',
    instructor: instructorName,
    instructorEmail: instructor?.email || '',
    offering,
  };
}
