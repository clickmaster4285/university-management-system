import { handle } from '../utils/asyncHandler.js';
import {
  AcademicSession,
  Campus,
  Program,
  StudentApplication,
} from '../models/index.js';
import { generateApplicationId } from '../utils/generateStudentId.js';

const notDeleted = { $ne: true };

export const getPublicPrograms = handle(async (_req, res) => {
  const programs = await Program.find({ isDeleted: notDeleted, status: 'Active' })
    .populate('departmentId', 'name code')
    .select('name code degreeLevel duration totalCredits departmentId')
    .sort({ name: 1 });

  res.json({ success: true, data: programs });
});

export const getPublicCampuses = handle(async (_req, res) => {
  const campuses = await Campus.find({ isDeleted: notDeleted })
    .select('name campusCode city province isMainCampus')
    .sort({ name: 1 });

  res.json({ success: true, data: campuses });
});

export const getPublicSessions = handle(async (_req, res) => {
  const sessions = await AcademicSession.find({
    isDeleted: notDeleted,
    status: { $in: ['Active', 'Upcoming'] },
  })
    .select('name code startDate endDate status isCurrent')
    .sort({ startDate: -1 });

  res.json({ success: true, data: sessions });
});

export const submitPublicApplication = handle(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    cnic,
    programId,
    campusId,
    academicSessionId,
    previousDegree,
    previousMarks,
  } = req.body;

  if (!firstName || !lastName || !email || !phone || !cnic || !programId || !campusId) {
    return res.status(400).json({
      success: false,
      message: 'firstName, lastName, email, phone, cnic, programId, and campusId are required',
    });
  }

  const program = await Program.findOne({ _id: programId, isDeleted: notDeleted });
  if (!program) {
    return res.status(400).json({ success: false, message: 'Invalid program selected' });
  }

  const campus = await Campus.findOne({ _id: campusId, isDeleted: notDeleted });
  if (!campus) {
    return res.status(400).json({ success: false, message: 'Invalid campus selected' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedCnic = cnic.trim();

  const duplicate = await StudentApplication.findOne({
    isDeleted: notDeleted,
    status: { $nin: ['Rejected'] },
    $or: [{ email: normalizedEmail }, { cnic: normalizedCnic }],
  });
  if (duplicate) {
    return res.status(409).json({
      success: false,
      message: 'An active application already exists with this email or CNIC',
    });
  }

  const applicationId = await generateApplicationId();
  const application = await StudentApplication.create({
    applicationId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    cnic: normalizedCnic,
    programId,
    campusId,
    academicSessionId: academicSessionId || null,
    previousDegree: previousDegree || '',
    previousMarks: previousMarks || '',
    source: 'public',
    status: 'Submitted',
  });

  const populated = await StudentApplication.findById(application._id)
    .populate('programId', 'name code')
    .populate('campusId', 'name campusCode');

  res.status(201).json({
    success: true,
    data: populated,
    message: `Application submitted. Your application ID is ${applicationId}`,
  });
});

export const trackPublicApplication = handle(async (req, res) => {
  const { applicationId, cnic } = req.query;

  if (!applicationId || !cnic) {
    return res.status(400).json({
      success: false,
      message: 'applicationId and cnic are required',
    });
  }

  const application = await StudentApplication.findOne({
    applicationId: String(applicationId).trim(),
    cnic: String(cnic).trim(),
    isDeleted: notDeleted,
  })
    .populate('programId', 'name code')
    .populate('campusId', 'name campusCode')
    .select('-remarks -reviewedBy -deletedAt -deletedBy');

  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'No application found with the provided details',
    });
  }

  res.json({
    success: true,
    data: {
      applicationId: application.applicationId,
      fullName: application.fullName,
      status: application.status,
      program: application.programId,
      campus: application.campusId,
      submittedAt: application.submittedAt,
      updatedAt: application.updatedAt,
    },
  });
});
