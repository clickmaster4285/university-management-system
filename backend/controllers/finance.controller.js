import { handle } from "../utils/asyncHandler.js";

import { Fee } from "../models/index.js";
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatMoney = (value) => Number(value || 0);

const buildFinancePayload = (fees) => {
  const totalAmount = fees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
  const totalPaid = fees.reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
  const totalOutstanding = fees.reduce((sum, fee) => sum + (fee.remainingAmount || 0), 0);

  const monthlyData = monthNames.map((month, index) => {
    const monthFees = fees.filter((fee) => {
      const createdAt = fee.createdAt ? new Date(fee.createdAt) : null;
      return createdAt && createdAt.getMonth() === index;
    });

    const revenue = monthFees.reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
    const expenses = monthFees.reduce((sum, fee) => sum + (fee.amount || 0), 0);

    return { month, revenue, expenses };
  });

  const feeTypeTotals = fees.reduce((acc, fee) => {
    const key = fee.feeType || 'Other';
    acc[key] = (acc[key] || 0) + (fee.amount || 0);
    return acc;
  }, {});

  const budgetAllocation = Object.entries(feeTypeTotals).map(([name, amount]) => ({
    name,
    percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0,
    amount: formatMoney(amount)
  }));

  const invoices = fees.map((fee) => ({
    invoiceId: fee.feeId || `INV-${fee._id}`,
    vendor: fee.studentName || fee.studentId || 'Student Fee',
    amount: formatMoney(fee.amount || 0),
    status: fee.paymentStatus || 'Pending',
    dueDate: fee.dueDate ? new Date(fee.dueDate).toISOString() : null,
    issuedDate: fee.createdAt ? new Date(fee.createdAt).toISOString() : null,
    description: `${fee.feeType || 'Fee'} for ${fee.program || 'student'}`,
    category: fee.feeType || 'Other'
  }));

  return {
    revenueYTD: formatMoney(totalPaid),
    expenses: formatMoney(totalAmount),
    netIncome: formatMoney(totalPaid - totalOutstanding),
    monthlyData,
    budgetAllocation,
    invoices,
    totalInvoices: invoices.length,
    fiscalYear: new Date().getFullYear().toString(),
    lastUpdated: new Date().toISOString()
  };
};

export const getFinanceData = handle(async (req, res) => {
  const fees = await Fee.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).lean();
  const data = buildFinancePayload(fees);

  return res.status(200).json({ success: true, data });
});

export const getFinanceSummary = handle(async (req, res) => {
  const fees = await Fee.find({ isDeleted: { $ne: true } }).lean();
  const data = buildFinancePayload(fees);

  return res.status(200).json({
    success: true,
    data: {
      revenueYTD: data.revenueYTD,
      expenses: data.expenses,
      netIncome: data.netIncome,
      totalInvoices: data.totalInvoices,
      paidInvoices: fees.filter((fee) => fee.paymentStatus === 'Paid').length,
      pendingInvoices: fees.filter((fee) => fee.paymentStatus === 'Pending').length
    }
  });
});

export const updateMonthlyData = handle(async (req, res) => {
  return res.status(200).json({ success: true, message: 'Monthly data update is handled from the fees collection', data: await Fee.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).lean() });
});

export const addInvoice = handle(async (req, res) => {
  return res.status(200).json({ success: true, message: 'Invoice creation is handled through fee records', data: await Fee.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).lean() });
});

export const updateInvoiceStatus = handle(async (req, res) => {
  return res.status(200).json({ success: true, message: 'Invoice status updates are handled through fee records', data: await Fee.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).lean() });
});

export const deleteInvoice = handle(async (req, res) => {
  return res.status(200).json({ success: true, message: 'Invoice deletion is handled through fee records', data: await Fee.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).lean() });
});

export const updateBudgetAllocation = handle(async (req, res) => {
  return res.status(200).json({ success: true, message: 'Budget updates are derived from fee records', data: await Fee.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).lean() });
});
