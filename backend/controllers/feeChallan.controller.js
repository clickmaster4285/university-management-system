import mongoose from 'mongoose';
import { handle } from '../utils/asyncHandler.js';
import { Fee, SemesterRegistration } from '../models/index.js';

const notDeleted = { $ne: true };

async function findChallanByIdentifier(identifier) {
  const query = [{ feeId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return Fee.findOne({ $or: query, isDeleted: notDeleted, source: 'semester_package' });
}

function populateChallan(query) {
  return query
    .populate('semesterRegistrationId', 'registrationId programSemester status registrationMode')
    .populate('createdBy', 'firstName lastName email');
}

export const listChallans = handle(async (req, res) => {
  const { paymentStatus, program, semester, studentId } = req.query;
  const filter = { isDeleted: notDeleted, source: 'semester_package' };

  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (program) filter.program = program;
  if (semester) filter.semester = parseInt(semester, 10);
  if (studentId) filter.studentId = studentId;

  const challans = await populateChallan(
    Fee.find(filter).sort({ createdAt: -1 })
  );

  res.json({
    success: true,
    count: challans.length,
    data: challans,
  });
});

export const getChallanById = handle(async (req, res) => {
  const found = await findChallanByIdentifier(req.params.id);
  if (!found) {
    return res.status(404).json({ success: false, message: 'Challan not found' });
  }

  const challan = await populateChallan(Fee.findById(found._id));
  res.json({ success: true, data: challan });
});

export const getChallanStats = handle(async (req, res) => {
  const match = { isDeleted: notDeleted, source: 'semester_package' };

  const [total, byStatus, totals] = await Promise.all([
    Fee.countDocuments(match),
    Fee.aggregate([{ $match: match }, { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }]),
    Fee.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalPaid: { $sum: '$paidAmount' },
          totalRemaining: { $sum: '$remainingAmount' },
        },
      },
    ]),
  ]);

  const statusCounts = {
    Paid: 0,
    Pending: 0,
    Partial: 0,
    Overdue: 0,
    Scholarship: 0,
    Waived: 0,
  };
  byStatus.forEach((row) => {
    statusCounts[row._id] = row.count;
  });

  res.json({
    success: true,
    data: {
      total,
      byStatus: statusCounts,
      totalAmount: totals[0]?.totalAmount || 0,
      totalPaid: totals[0]?.totalPaid || 0,
      totalRemaining: totals[0]?.totalRemaining || 0,
    },
  });
});

export const recordChallanPayment = handle(async (req, res) => {
  const found = await findChallanByIdentifier(req.params.id);
  if (!found) {
    return res.status(404).json({ success: false, message: 'Challan not found' });
  }

  const { amount, paymentMethod = 'Cash', transactionId, notes } = req.body;
  const payAmount = Number(amount);

  if (!Number.isFinite(payAmount) || payAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
  }

  const remaining = found.remainingAmount ?? found.amount - (found.paidAmount || 0);
  if (payAmount > remaining) {
    return res.status(400).json({
      success: false,
      message: `Payment exceeds remaining balance (PKR ${remaining})`,
    });
  }

  found.paidAmount = (found.paidAmount || 0) + payAmount;
  found.paymentHistory = found.paymentHistory || [];
  found.paymentHistory.push({
    amount: payAmount,
    method: paymentMethod,
    date: new Date(),
    transactionId: transactionId || '',
    notes: notes || '',
    status: 'Completed',
  });

  if (found.paidAmount >= found.amount) {
    found.paymentStatus = 'Paid';
    found.paidDate = new Date();
    found.remainingAmount = 0;
  } else {
    found.paymentStatus = 'Partial';
    found.remainingAmount = found.amount - found.paidAmount;
  }

  found.paymentMethod = paymentMethod;
  found.updatedBy = req.user?._id || null;
  await found.save();

  if (found.semesterRegistrationId) {
    const registration = await SemesterRegistration.findById(found.semesterRegistrationId);
    if (registration) {
      registration.status = found.paymentStatus === 'Paid' ? 'Paid' : 'Partial';
      await registration.save();
    }
  }

  const challan = await populateChallan(Fee.findById(found._id));
  res.json({
    success: true,
    data: challan,
    message: 'Payment recorded successfully',
  });
});
