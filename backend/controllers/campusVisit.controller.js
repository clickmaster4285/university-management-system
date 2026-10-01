import { handle } from '../utils/asyncHandler.js';
import { CampusVisit, Campus, Program } from '../models/index.js';
import Counter from '../models/Counter.model.js';

const notDeleted = { $ne: true };

async function nextVisitId() {
  const year = new Date().getFullYear().toString().slice(-2);
  const counter = await Counter.findOneAndUpdate(
    { _id: `campusVisit:${year}` },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return `VIS-${year}-${String(counter.seq).padStart(4, '0')}`;
}

function populateVisit(query) {
  return query
    .populate('campusId', 'name campusCode')
    .populate('interestedProgramId', 'name code')
    .populate('createdBy', 'email');
}

export const listCampusVisits = handle(async (req, res) => {
  const { status, campusId, search, page = 1, limit = 100 } = req.query;
  const filter = { isDeleted: notDeleted };
  if (status) filter.status = status;
  if (campusId) filter.campusId = campusId;
  if (search) {
    filter.$or = [
      { visitorName: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { visitId: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [data, total] = await Promise.all([
    populateVisit(
      CampusVisit.find(filter).sort({ visitedAt: -1 }).skip(skip).limit(parseInt(limit, 10))
    ),
    CampusVisit.countDocuments(filter),
  ]);

  res.json({ success: true, count: data.length, total, data });
});

export const createCampusVisit = handle(async (req, res) => {
  const {
    visitorName,
    phone,
    email,
    campusId,
    interestedProgramId,
    purpose,
    notes,
    visitedAt,
    status,
  } = req.body;

  if (!visitorName?.trim()) {
    return res.status(400).json({ success: false, message: 'visitorName is required' });
  }

  if (campusId) {
    const campus = await Campus.findOne({ _id: campusId, isDeleted: notDeleted });
    if (!campus) {
      return res.status(400).json({ success: false, message: 'Invalid campus' });
    }
  }
  if (interestedProgramId) {
    const program = await Program.findOne({ _id: interestedProgramId, isDeleted: notDeleted });
    if (!program) {
      return res.status(400).json({ success: false, message: 'Invalid program' });
    }
  }

  const visit = await CampusVisit.create({
    visitId: await nextVisitId(),
    visitorName: visitorName.trim(),
    phone: phone?.trim() || '',
    email: email?.trim()?.toLowerCase() || '',
    campusId: campusId || null,
    interestedProgramId: interestedProgramId || null,
    purpose: purpose || 'Info',
    notes: notes || '',
    visitedAt: visitedAt ? new Date(visitedAt) : new Date(),
    status: status || 'New',
    createdBy: req.user?._id || null,
  });

  const populated = await populateVisit(CampusVisit.findById(visit._id));
  res.status(201).json({ success: true, data: populated, message: 'Visit logged' });
});

export const updateCampusVisit = handle(async (req, res) => {
  const visit = await CampusVisit.findOne({
    $or: [{ _id: req.params.id }, { visitId: req.params.id }],
    isDeleted: notDeleted,
  });
  if (!visit) {
    return res.status(404).json({ success: false, message: 'Visit not found' });
  }

  const fields = [
    'visitorName',
    'phone',
    'email',
    'campusId',
    'interestedProgramId',
    'purpose',
    'notes',
    'visitedAt',
    'status',
  ];
  for (const key of fields) {
    if (req.body[key] !== undefined) {
      if (key === 'visitedAt') visit.visitedAt = req.body[key] ? new Date(req.body[key]) : visit.visitedAt;
      else if (key === 'campusId' || key === 'interestedProgramId') {
        visit[key] = req.body[key] || null;
      } else if (typeof req.body[key] === 'string') {
        visit[key] = req.body[key].trim();
      } else {
        visit[key] = req.body[key];
      }
    }
  }

  await visit.save();
  const populated = await populateVisit(CampusVisit.findById(visit._id));
  res.json({ success: true, data: populated, message: 'Visit updated' });
});

export const deleteCampusVisit = handle(async (req, res) => {
  const visit = await CampusVisit.findOne({
    $or: [{ _id: req.params.id }, { visitId: req.params.id }],
    isDeleted: notDeleted,
  });
  if (!visit) {
    return res.status(404).json({ success: false, message: 'Visit not found' });
  }
  visit.isDeleted = true;
  visit.deletedAt = new Date();
  await visit.save();
  res.json({ success: true, message: 'Visit removed' });
});
