import mongoose from 'mongoose';
import { handle } from '../utils/asyncHandler.js';
import { Subject, Program, SubjectFeeHistory, FEE_TYPES } from '../models/index.js';

const notDeleted = { $ne: true };

async function findSubjectByIdentifier(identifier) {
  const query = [{ subjectId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return Subject.findOne({ $or: query, isDeleted: notDeleted });
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayBefore(date) {
  const d = startOfDay(date);
  d.setDate(d.getDate() - 1);
  return d;
}

function activeAtDateFilter(atDate) {
  return {
    effectiveFrom: { $lte: atDate },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: atDate } }],
  };
}

async function populateFeeRow(query) {
  return query
    .populate('programId', 'name code')
    .populate('changedBy', 'name email');
}

async function resolveFeeAtDate(subjectId, programId, atDate) {
  const dateFilter = activeAtDateFilter(atDate);

  if (programId) {
    const programSpecific = await populateFeeRow(
      SubjectFeeHistory.findOne({
        subjectId,
        programId,
        ...dateFilter,
      }).sort({ effectiveFrom: -1 })
    );
    if (programSpecific) return programSpecific;
  }

  return populateFeeRow(
    SubjectFeeHistory.findOne({
      subjectId,
      programId: null,
      ...dateFilter,
    }).sort({ effectiveFrom: -1 })
  );
}

export const getSubjectFees = handle(async (req, res) => {
  const subject = await findSubjectByIdentifier(req.params.id);
  if (!subject) {
    return res.status(404).json({ success: false, message: 'Subject not found' });
  }

  const filter = { subjectId: subject._id };
  if (req.query.programId) {
    filter.programId = req.query.programId === 'default' ? null : req.query.programId;
  }

  const fees = await populateFeeRow(
    SubjectFeeHistory.find(filter).sort({ effectiveFrom: -1 })
  );

  const currentDefault = await resolveFeeAtDate(subject._id, null, new Date());

  res.json({
    success: true,
    count: fees.length,
    data: {
      subject: {
        _id: subject._id,
        subjectId: subject.subjectId,
        code: subject.code,
        name: subject.name,
        credits: subject.credits,
      },
      currentDefault,
      history: fees,
    },
  });
});

export const getCurrentSubjectFee = handle(async (req, res) => {
  const subject = await findSubjectByIdentifier(req.params.id);
  if (!subject) {
    return res.status(404).json({ success: false, message: 'Subject not found' });
  }

  const { programId, date } = req.query;
  const atDate = date ? startOfDay(date) : startOfDay(new Date());
  if (Number.isNaN(atDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date',
    });
  }

  if (programId) {
    const program = await Program.findOne({ _id: programId, isDeleted: notDeleted });
    if (!program) {
      return res.status(400).json({
        success: false,
        message: 'Program not found',
      });
    }
  }

  const rate = await resolveFeeAtDate(subject._id, programId || null, atDate);

  res.json({
    success: true,
    data: {
      subjectId: subject._id,
      programId: programId || null,
      atDate,
      rate,
      totalFee: rate ? rate.feePerCredit * subject.credits : null,
    },
  });
});

export const addSubjectFee = handle(async (req, res) => {
  const subject = await findSubjectByIdentifier(req.params.id);
  if (!subject) {
    return res.status(404).json({ success: false, message: 'Subject not found' });
  }

  const { feePerCredit, feeType, effectiveFrom, programId, reason } = req.body;

  if (feePerCredit === undefined || feePerCredit === null || feePerCredit === '') {
    return res.status(400).json({
      success: false,
      message: 'feePerCredit is required',
    });
  }

  const fee = Number(feePerCredit);
  if (!Number.isFinite(fee) || fee < 0) {
    return res.status(400).json({
      success: false,
      message: 'feePerCredit must be a non-negative number',
    });
  }

  if (feeType && !FEE_TYPES.includes(feeType)) {
    return res.status(400).json({
      success: false,
      message: `feeType must be one of: ${FEE_TYPES.join(', ')}`,
    });
  }

  if (programId) {
    const program = await Program.findOne({ _id: programId, isDeleted: notDeleted });
    if (!program) {
      return res.status(400).json({
        success: false,
        message: 'Program not found',
      });
    }
  }

  const effectiveDate = effectiveFrom ? startOfDay(effectiveFrom) : startOfDay(new Date());
  if (Number.isNaN(effectiveDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid effectiveFrom date',
    });
  }

  const scopeProgramId = programId || null;
  const previous = await SubjectFeeHistory.findOne({
    subjectId: subject._id,
    programId: scopeProgramId,
    effectiveTo: null,
  });

  if (previous) {
    if (startOfDay(previous.effectiveFrom) >= effectiveDate) {
      return res.status(400).json({
        success: false,
        message: 'effectiveFrom must be after the current rate start date',
      });
    }
    previous.effectiveTo = dayBefore(effectiveDate);
    await previous.save();
  }

  const created = await SubjectFeeHistory.create({
    subjectId: subject._id,
    programId: scopeProgramId,
    feePerCredit: fee,
    feeType: feeType || 'Tuition',
    effectiveFrom: effectiveDate,
    effectiveTo: null,
    changedBy: req.user?._id || null,
    reason: reason ? String(reason).trim() : '',
  });

  const populated = await populateFeeRow(SubjectFeeHistory.findById(created._id));

  res.status(201).json({
    success: true,
    message: 'Fee rate added successfully',
    data: populated,
  });
});
