import { handle } from '../utils/asyncHandler.js';
import { Fee, SemesterRegistration } from '../models/index.js';

const notDeleted = { $ne: true };

export const getMyProfile = handle(async (req, res) => {
  res.json({ success: true, data: req.student });
});

export const getMyRegistrations = handle(async (req, res) => {
  const registrations = await SemesterRegistration.find({
    studentId: req.student._id,
    isDeleted: notDeleted,
  })
    .populate('programId', 'name code')
    .populate('batchId', 'name code')
    .populate('academicSessionId', 'name code startDate endDate')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: registrations.length,
    data: registrations,
  });
});

export const getMyChallans = handle(async (req, res) => {
  const challans = await Fee.find({
    studentId: String(req.student._id),
    isDeleted: notDeleted,
    source: 'semester_package',
  })
    .populate('semesterRegistrationId', 'registrationId programSemester status registrationMode')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: challans.length,
    data: challans,
  });
});
