import mongoose from 'mongoose';
import { handle } from '../utils/asyncHandler.js';
import {
  Program,
  StudentApplication,
  StudentAdmission,
} from '../models/index.js';
import { generateApplicationId, generateAdmissionDossierId } from '../utils/generateStudentId.js';

const notDeleted = { $ne: true };

function populateApplication(query) {
  return query
    .populate('programId', 'name code degreeLevel')
    .populate('campusId', 'name campusCode')
    .populate('academicSessionId', 'name code')
    .populate('reviewedBy', 'firstName lastName email')
    .populate('admissionDossierId', 'admissionId status');
}

export const listApplications = handle(async (req, res) => {
  const { status, programId, campusId, search, page = 1, limit = 50 } = req.query;
  const filter = { isDeleted: notDeleted };

  if (status) filter.status = status;
  if (programId) filter.programId = programId;
  if (campusId) filter.campusId = campusId;

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { cnic: { $regex: search, $options: 'i' } },
      { applicationId: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [data, total] = await Promise.all([
    populateApplication(
      StudentApplication.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10))
    ),
    StudentApplication.countDocuments(filter),
  ]);

  res.json({ success: true, count: data.length, total, data });
});

export const getApplicationStats = handle(async (_req, res) => {
  const match = { isDeleted: notDeleted };
  const [total, submitted, underReview, shortlisted, accepted, rejected, promoted] =
    await Promise.all([
      StudentApplication.countDocuments(match),
      StudentApplication.countDocuments({ ...match, status: 'Submitted' }),
      StudentApplication.countDocuments({ ...match, status: 'Under Review' }),
      StudentApplication.countDocuments({ ...match, status: 'Shortlisted' }),
      StudentApplication.countDocuments({ ...match, status: 'Accepted' }),
      StudentApplication.countDocuments({ ...match, status: 'Rejected' }),
      StudentApplication.countDocuments({ ...match, status: 'Promoted' }),
    ]);

  res.json({
    success: true,
    data: { total, submitted, underReview, shortlisted, accepted, rejected, promoted },
  });
});

export const getApplicationById = handle(async (req, res) => {
  const query = [{ applicationId: req.params.id }];
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    query.unshift({ _id: req.params.id });
  }

  const application = await populateApplication(
    StudentApplication.findOne({ $or: query, isDeleted: notDeleted })
  );

  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  res.json({ success: true, data: application });
});

export const createInternalApplication = handle(async (req, res) => {
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
    return res.status(400).json({ success: false, message: 'Invalid program' });
  }

  const applicationId = await generateApplicationId();
  const application = await StudentApplication.create({
    applicationId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    cnic: cnic.trim(),
    programId,
    campusId,
    academicSessionId: academicSessionId || null,
    previousDegree: previousDegree || '',
    previousMarks: previousMarks || '',
    source: 'internal',
    status: 'Submitted',
    reviewedBy: req.user?._id || null,
  });

  const populated = await populateApplication(StudentApplication.findById(application._id));
  res.status(201).json({ success: true, data: populated });
});

export const updateApplicationStatus = handle(async (req, res) => {
  const query = [{ applicationId: req.params.id }];
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    query.unshift({ _id: req.params.id });
  }

  const application = await StudentApplication.findOne({ $or: query, isDeleted: notDeleted });
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  const { status, remarks } = req.body;
  const allowed = ['Submitted', 'Under Review', 'Shortlisted', 'Accepted', 'Rejected'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  application.status = status;
  if (remarks !== undefined) application.remarks = remarks;
  application.reviewedBy = req.user?._id || null;
  await application.save();

  const populated = await populateApplication(StudentApplication.findById(application._id));
  res.json({ success: true, data: populated });
});

export const promoteApplication = handle(async (req, res) => {
  const query = [{ applicationId: req.params.id }];
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    query.unshift({ _id: req.params.id });
  }

  const application = await StudentApplication.findOne({ $or: query, isDeleted: notDeleted });
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  if (!['Accepted', 'Shortlisted'].includes(application.status)) {
    return res.status(400).json({
      success: false,
      message: 'Only accepted or shortlisted applications can be promoted',
    });
  }

  if (application.admissionDossierId) {
    const existing = await StudentAdmission.findById(application.admissionDossierId);
    return res.json({ success: true, data: existing, message: 'Admission dossier already exists' });
  }

  const program = await Program.findById(application.programId);
  const admissionId = await generateAdmissionDossierId();

  const dossier = await StudentAdmission.create({
    admissionId,
    applicationId: application._id,
    firstName: application.firstName,
    lastName: application.lastName,
    email: application.email,
    phone: application.phone,
    cnic: application.cnic,
    programId: application.programId,
    departmentId: program?.departmentId || null,
    campusId: application.campusId,
    academicSessionId: application.academicSessionId,
    guardian: { fatherName: '' },
    previousEducation:
      application.previousDegree
        ? [{ degree: application.previousDegree, grade: application.previousMarks || '' }]
        : [],
    status: 'In Progress',
    admissionOfficer: req.user?._id || null,
  });

  application.status = 'Promoted';
  application.admissionDossierId = dossier._id;
  application.reviewedBy = req.user?._id || null;
  await application.save();

  res.status(201).json({ success: true, data: dossier });
});

export const deleteApplication = handle(async (req, res) => {
  const query = [{ applicationId: req.params.id }];
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    query.unshift({ _id: req.params.id });
  }

  const application = await StudentApplication.findOne({ $or: query, isDeleted: notDeleted });
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  application.isDeleted = true;
  application.deletedAt = new Date();
  application.deletedBy = req.user?._id || null;
  await application.save();

  res.json({ success: true, message: 'Application deleted' });
});
