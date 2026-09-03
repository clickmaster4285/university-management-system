import { handle } from '../utils/asyncHandler.js';
import { Recruitment, StaffMember, Department } from '../models/index.js';
import { generateStaffId } from '../utils/generateStaffId.js';

const notDeleted = { $ne: true };

export const listRecruitments = handle(async (req, res) => {
  const { status, search, page = 1, limit = 100 } = req.query;
  const filter = { isDeleted: notDeleted };
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } },
      { positionId: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [records, total] = await Promise.all([
    Recruitment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
    Recruitment.countDocuments(filter),
  ]);

  res.json({ success: true, count: records.length, total, data: records });
});

export const getRecruitmentStats = handle(async (_req, res) => {
  const match = { isDeleted: notDeleted };
  const [open, interviewing, filled, totalApplicants] = await Promise.all([
    Recruitment.countDocuments({ ...match, status: 'Open' }),
    Recruitment.countDocuments({ ...match, status: 'Interviewing' }),
    Recruitment.countDocuments({ ...match, status: 'Filled' }),
    Recruitment.aggregate([
      { $match: match },
      { $project: { applicantCount: { $size: { $ifNull: ['$applicants', []] } } } },
      { $group: { _id: null, total: { $sum: '$applicantCount' } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      open,
      interviewing,
      filled,
      totalApplicants: totalApplicants[0]?.total || 0,
    },
  });
});

export const getRecruitmentById = handle(async (req, res) => {
  const record = await Recruitment.findOne({ _id: req.params.id, isDeleted: notDeleted });
  if (!record) {
    return res.status(404).json({ success: false, message: 'Recruitment posting not found' });
  }
  res.json({ success: true, data: record });
});

export const createRecruitment = handle(async (req, res) => {
  const { title, department, type, description, requirements, responsibilities, closingDate, salaryRange } = req.body;
  if (!title || !department || !type || !description) {
    return res.status(400).json({
      success: false,
      message: 'title, department, type, and description are required',
    });
  }

  const record = await Recruitment.create({
    title: title.trim(),
    department: department.trim(),
    type,
    description: description.trim(),
    requirements: requirements || [],
    responsibilities: responsibilities || [],
    closingDate: closingDate ? new Date(closingDate) : null,
    salaryRange: salaryRange || {},
    createdBy: req.user?._id || null,
  });

  res.status(201).json({ success: true, data: record });
});

export const updateRecruitment = handle(async (req, res) => {
  const record = await Recruitment.findOne({ _id: req.params.id, isDeleted: notDeleted });
  if (!record) {
    return res.status(404).json({ success: false, message: 'Recruitment posting not found' });
  }

  const fields = ['title', 'department', 'type', 'description', 'requirements', 'responsibilities', 'status', 'closingDate', 'salaryRange'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) record[field] = req.body[field];
  });
  if (req.body.closingDate) record.closingDate = new Date(req.body.closingDate);

  await record.save();
  res.json({ success: true, data: record });
});

export const deleteRecruitment = handle(async (req, res) => {
  const record = await Recruitment.findOne({ _id: req.params.id, isDeleted: notDeleted });
  if (!record) {
    return res.status(404).json({ success: false, message: 'Recruitment posting not found' });
  }

  record.isDeleted = true;
  record.deletedAt = new Date();
  record.deletedBy = req.user?._id || null;
  await record.save();

  res.json({ success: true, message: 'Recruitment posting deleted' });
});

export const addRecruitmentApplicant = handle(async (req, res) => {
  const record = await Recruitment.findOne({ _id: req.params.id, isDeleted: notDeleted });
  if (!record) {
    return res.status(404).json({ success: false, message: 'Recruitment posting not found' });
  }

  const { name, email, phone, resume } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'name and email are required' });
  }

  record.applicants.push({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone || '',
    resume: resume || '',
    status: 'Applied',
  });
  await record.save();

  res.status(201).json({ success: true, data: record });
});

export const updateApplicantStatus = handle(async (req, res) => {
  const record = await Recruitment.findOne({ _id: req.params.id, isDeleted: notDeleted });
  if (!record) {
    return res.status(404).json({ success: false, message: 'Recruitment posting not found' });
  }

  const applicant = record.applicants.id(req.params.applicantId);
  if (!applicant) {
    return res.status(404).json({ success: false, message: 'Applicant not found' });
  }

  const { status } = req.body;
  const allowed = ['Applied', 'Shortlisted', 'Interviewed', 'Offered', 'Rejected', 'Hired'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid applicant status' });
  }

  applicant.status = status;
  await record.save();
  res.json({ success: true, data: record });
});

export const hireApplicant = handle(async (req, res) => {
  const record = await Recruitment.findOne({ _id: req.params.id, isDeleted: notDeleted });
  if (!record) {
    return res.status(404).json({ success: false, message: 'Recruitment posting not found' });
  }

  const applicant = record.applicants.id(req.params.applicantId);
  if (!applicant) {
    return res.status(404).json({ success: false, message: 'Applicant not found' });
  }

  if (applicant.hiredStaffMemberId) {
    return res.status(409).json({
      success: false,
      message: 'Applicant already hired as staff member',
    });
  }

  const existingStaff = await StaffMember.findOne({
    email: applicant.email,
    isDeleted: notDeleted,
  });
  if (existingStaff) {
    return res.status(409).json({
      success: false,
      message: `Staff member with email ${applicant.email} already exists`,
    });
  }

  const nameParts = applicant.name.trim().split(/\s+/);
  const firstName = nameParts[0] || 'New';
  const lastName = nameParts.slice(1).join(' ') || 'Hire';

  const department = await Department.findOne({
    name: { $regex: new RegExp(`^${record.department}$`, 'i') },
    isDeleted: notDeleted,
  }) || await Department.findOne({ isDeleted: notDeleted });

  if (!department) {
    return res.status(400).json({
      success: false,
      message: 'No department found. Create at least one department before hiring.',
    });
  }

  const staffId = await generateStaffId();
  const staff = await StaffMember.create({
    staffId,
    firstName,
    lastName,
    email: applicant.email,
    phone: applicant.phone || '',
    joiningDate: new Date(),
    jobDescription: record.description,
    status: 'Active',
    isAcademic: record.type === 'Full-time' && /faculty|professor|lecturer|teacher/i.test(record.title),
    hiredFromRecruitmentId: record._id,
    employments: [{
      departmentId: department._id,
      campusId: department.campusId || null,
      designation: record.title,
      employmentType: record.type === 'Internship' ? 'Intern' : record.type,
      isPrimary: true,
      startDate: new Date(),
    }],
    notes: `Hired from recruitment ${record.positionId}`,
  });

  applicant.status = 'Hired';
  applicant.hiredStaffMemberId = staff._id;
  if (record.status !== 'Filled') record.status = 'Offer Extended';
  await record.save();

  res.status(201).json({
    success: true,
    data: { recruitment: record, staffMember: staff },
    message: 'Applicant hired and staff record created',
  });
});
