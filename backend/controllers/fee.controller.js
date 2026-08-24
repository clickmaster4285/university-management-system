// backend/src/controllers/fee.controller.js
import mongoose from 'mongoose';
import { handle } from "../utils/asyncHandler.js";

import { Fee, FeeStructure } from '../models/index.js';
const getAuditUserId = (userId) => {
  if (!userId) return undefined;
  return mongoose.Types.ObjectId.isValid(userId) ? userId : undefined;
};

// ==================== GET FEES ====================

// Get all fees with filtering
export const getAllFees = handle(async (req, res) => {
  const { 
    status, 
    studentId,
    studentName,
    search,
    fromDate,
    toDate,
    feeType,
    feeStructureId,
    limit = 50, 
    page = 1 
  } = req.query;
  
  const query = { isDeleted: { $ne: true } };
  if (status) query.paymentStatus = status;
  if (studentId) query.studentId = { $regex: studentId, $options: 'i' };
  if (studentName) query.studentName = { $regex: studentName, $options: 'i' };
  if (feeType) query.feeType = feeType;
  if (feeStructureId) query.feeStructureId = feeStructureId;
  if (fromDate || toDate) {
    query.dueDate = {};
    if (fromDate) query.dueDate.$gte = new Date(fromDate);
    if (toDate) query.dueDate.$lte = new Date(toDate);
  }
  
  if (search) {
    query.$or = [
      { studentName: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
      { studentEmail: { $regex: search, $options: 'i' } },
      { feeId: { $regex: search, $options: 'i' } },
      { invoiceNumber: { $regex: search, $options: 'i' } },
      { feeStructureName: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [fees, total] = await Promise.all([
    Fee.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .populate('feeStructureId', 'name program semester'),
    Fee.countDocuments(query)
  ]);

  return res.json({
    success: true,
    data: fees || [],
    pagination: {
      total: total || 0,
      page: parseInt(page) || 1,
      pages: Math.ceil((total || 0) / parseInt(limit)) || 0,
      limit: parseInt(limit) || 50
    }
  });
});

// Get fee by ID
export const getFeeById = handle(async (req, res) => {
  const fee = await Fee.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
    .populate('createdBy', 'name email')
    .populate('feeStructureId', 'name program semester courses');
  
  if (!fee) {
    return res.status(404).json({ 
      success: false, 
      message: 'Fee record not found',
      data: null
    });
  }
  
  return res.json({ 
    success: true, 
    data: fee 
  });
});

// Get fees by student
export const getFeesByStudent = handle(async (req, res) => {
  const { studentId } = req.params;
  
  const fees = await Fee.find({ studentId, isDeleted: { $ne: true } })
    .sort({ dueDate: 1 })
    .populate('feeStructureId', 'name program semester');
  
  return res.json({
    success: true,
    data: fees
  });
});

// ==================== CREATE FEES ====================

// Create new fee
export const createFee = handle(async (req, res) => {
  // Required fields
  const requiredFields = ['studentId', 'studentName', 'studentEmail', 'department', 'program', 'semester', 'feeType', 'amount', 'dueDate'];
  const missingFields = requiredFields.filter(field => {
    const value = req.body[field];
    return value === undefined || value === null || value === '' || value === 0;
  });
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: ' + missingFields.join(', '),
      data: null
    });
  }

  const userId = getAuditUserId(req.user?._id || req.user?.userId || req.user?.id || null);

  // If feeStructureId is provided, get structure details
  let feeStructureData = {};
  if (req.body.feeStructureId) {
    const structure = await FeeStructure.findOne({ _id: req.body.feeStructureId, isDeleted: { $ne: true } });
    if (structure) {
      feeStructureData = {
        feeStructureId: structure._id,
        feeStructureName: structure.name,
        feeBreakdown: {
          courseFees: structure.courses.reduce((acc, course) => {
            acc[course.courseCode] = course.totalFee;
            return acc;
          }, {}),
          additionalFees: structure.additionalFees.reduce((acc, fee) => {
            acc[fee.name] = fee.type === 'Fixed' ? fee.amount : (structure.totalCourseFee * fee.percentage / 100);
            return acc;
          }, {}),
          discountApplied: structure.discountEnabled ? structure.discountAmount : 0,
          lateFeeApplied: 0
        }
      };
      
      // Use structure's total as amount if not specified
      if (!req.body.amount || req.body.amount === 0) {
        req.body.amount = structure.finalPayable;
      }
    }
  }

  const feeData = {
    studentId: req.body.studentId.trim(),
    studentName: req.body.studentName.trim(),
    studentEmail: req.body.studentEmail.trim().toLowerCase(),
    studentRegistrationNo: req.body.studentRegistrationNo || '',
    department: req.body.department.trim(),
    program: req.body.program.trim(),
    semester: parseInt(req.body.semester) || 1,
    feeType: req.body.feeType,
    amount: parseFloat(req.body.amount) || 0,
    paidAmount: parseFloat(req.body.paidAmount) || 0,
    dueDate: new Date(req.body.dueDate),
    paymentMethod: req.body.paymentMethod || 'Cash',
    paymentStatus: req.body.paymentStatus || 'Pending',
    isScholarship: req.body.isScholarship || false,
    scholarshipPercentage: parseFloat(req.body.scholarshipPercentage) || 0,
    scholarshipAmount: parseFloat(req.body.scholarshipAmount) || 0,
    isInstallment: req.body.isInstallment || false,
    installmentCount: parseInt(req.body.installmentCount) || 1,
    installmentPaid: parseInt(req.body.installmentPaid) || 0,
    lateFee: parseFloat(req.body.lateFee) || 0,
    invoiceNumber: req.body.invoiceNumber || '',
    remarks: req.body.remarks || '',
    createdBy: userId,
    ...feeStructureData
  };

  // Calculate scholarship amount if percentage is provided
  if (feeData.isScholarship && feeData.scholarshipPercentage > 0) {
    feeData.scholarshipAmount = (feeData.amount * feeData.scholarshipPercentage) / 100;
  }

  // Generate installments if installment payment
  if (feeData.isInstallment && feeData.installmentCount > 1) {
    const installmentAmount = feeData.amount / feeData.installmentCount;
    const dueDate = new Date(feeData.dueDate);
    feeData.installmentDetails = [];
    for (let i = 1; i <= feeData.installmentCount; i++) {
      const installmentDue = new Date(dueDate);
      installmentDue.setMonth(dueDate.getMonth() + (i - 1));
      feeData.installmentDetails.push({
        installmentNumber: i,
        amount: installmentAmount,
        dueDate: installmentDue,
        status: 'Pending'
      });
    }
  }


  const fee = new Fee(feeData);
  await fee.save();
  
  
  return res.status(201).json({ 
    success: true, 
    data: fee,
    message: 'Fee record created successfully. ID: ' + fee.feeId
  });
});

// Generate fee from structure for a student
export const generateFeeFromStructure = handle(async (req, res) => {
  const { studentId, feeStructureId, dueDate } = req.body;
  
  
  if (!studentId || !feeStructureId) {
    return res.status(400).json({
      success: false,
      message: 'Student ID and Fee Structure ID are required'
    });
  }

  // Get fee structure
  const structure = await FeeStructure.findOne({ _id: feeStructureId, isDeleted: { $ne: true } });
  if (!structure) {
    return res.status(404).json({
      success: false,
      message: 'Fee structure not found'
    });
  }

  if (structure.status !== 'Active') {
    return res.status(400).json({
      success: false,
      message: 'Fee structure is not active'
    });
  }

  // Check if student already has a fee for this structure
  const existingFee = await Fee.findOne({
    studentId: studentId,
    feeStructureId: feeStructureId,
    paymentStatus: { $ne: 'Paid' },
    isDeleted: { $ne: true }
  });

  if (existingFee) {
    return res.status(400).json({
      success: false,
      message: 'Student already has an active fee for this structure'
    });
  }

  // Get student details (you might need to fetch from Student model)
  // For now, using placeholder data
  const studentData = {
    name: 'Student Name',
    email: 'student@email.com',
    department: structure.department,
    program: structure.program,
    semester: structure.semester
  };

  // Create fee data from structure
  const feeData = {
    studentId: studentId,
    studentName: studentData.name || 'Unknown Student',
    studentEmail: studentData.email || 'unknown@email.com',
    department: studentData.department || structure.department,
    program: studentData.program || structure.program,
    semester: studentData.semester || structure.semester,
    feeType: 'Tuition',
    amount: structure.finalPayable,
    paidAmount: 0,
    dueDate: new Date(dueDate || Date.now() + 30 * 24 * 60 * 60 * 1000),
    paymentMethod: 'Cash',
    paymentStatus: 'Pending',
    feeStructureId: structure._id,
    feeStructureName: structure.name,
    feeBreakdown: {
      courseFees: structure.courses.reduce((acc, course) => {
        acc[course.courseCode] = course.totalFee;
        return acc;
      }, {}),
      additionalFees: structure.additionalFees.reduce((acc, fee) => {
        acc[fee.name] = fee.type === 'Fixed' ? fee.amount : (structure.totalCourseFee * fee.percentage / 100);
        return acc;
      }, {}),
      discountApplied: structure.discountEnabled ? structure.discountAmount : 0,
      lateFeeApplied: 0
    },
    createdBy: req.user?.id || null
  };

  // Generate installments if payment type is Installments
  if (structure.paymentType === 'Installments' && structure.installments.length > 0) {
    feeData.isInstallment = true;
    feeData.installmentCount = structure.installments.length;
    feeData.installmentDetails = structure.installments.map(inst => ({
      installmentNumber: inst.installmentNumber,
      amount: inst.amount,
      dueDate: new Date(inst.dueDate),
      status: 'Pending'
    }));
  }

  const fee = new Fee(feeData);
  await fee.save();


  return res.status(201).json({
    success: true,
    data: fee,
    message: 'Fee generated successfully from structure'
  });
});

// ==================== UPDATE FEES ====================

// Update fee
export const updateFee = handle(async (req, res) => {
  const fee = await Fee.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!fee) {
    return res.status(404).json({ 
      success: false, 
      message: 'Fee record not found',
      data: null
    });
  }

  const userId = getAuditUserId(req.user?._id || req.user?.userId || req.user?.id || null);

  const updateableFields = [
    'studentId', 'studentName', 'studentEmail', 'studentRegistrationNo',
    'department', 'program', 'semester', 'feeType', 'amount', 'paidAmount',
    'dueDate', 'paidDate', 'paymentMethod', 'paymentStatus', 'transactionId',
    'paymentReference', 'isScholarship', 'scholarshipPercentage',
    'scholarshipAmount', 'scholarshipType', 'isInstallment', 'installmentCount',
    'installmentPaid', 'installmentDetails', 'lateFee', 'lateFeeApplied',
    'invoiceNumber', 'remarks', 'isActive'
  ];
  
  let hasUpdates = false;
  
  updateableFields.forEach(function(field) {
    if (req.body[field] !== undefined) {
      const value = req.body[field];
      
      if (field === 'amount' || field === 'paidAmount' || field === 'scholarshipPercentage' || 
          field === 'scholarshipAmount' || field === 'lateFee' || field === 'semester' ||
          field === 'installmentCount' || field === 'installmentPaid') {
        const numValue = parseFloat(value) || 0;
        if (fee[field] !== numValue) {
          fee[field] = numValue;
          hasUpdates = true;
        }
      } else if (field === 'dueDate' || field === 'paidDate') {
        if (value !== '' && value !== null && value !== undefined) {
          const parsedDate = new Date(value);
          if (!isNaN(parsedDate.getTime())) {
            if (fee[field]?.getTime() !== parsedDate.getTime()) {
              fee[field] = parsedDate;
              hasUpdates = true;
            }
          }
        }
      } else if (field === 'isScholarship' || field === 'isInstallment' || field === 'lateFeeApplied') {
        const boolValue = value === true || value === 'true';
        if (fee[field] !== boolValue) {
          fee[field] = boolValue;
          hasUpdates = true;
        }
      } else if (field === 'installmentDetails') {
        const arrayValue = Array.isArray(value) ? value : [];
        if (JSON.stringify(fee[field] || []) !== JSON.stringify(arrayValue)) {
          fee[field] = arrayValue;
          hasUpdates = true;
        }
      } else {
        const stringValue = typeof value === 'string' ? value.trim() : value;
        if (fee[field] !== stringValue) {
          fee[field] = stringValue;
          hasUpdates = true;
        }
      }
    }
  });

  // Recalculate remaining amount and scholarship if needed
  if (fee.isScholarship && fee.scholarshipPercentage > 0) {
    const newScholarshipAmount = (fee.amount * fee.scholarshipPercentage) / 100;
    if (fee.scholarshipAmount !== newScholarshipAmount) {
      fee.scholarshipAmount = newScholarshipAmount;
      hasUpdates = true;
    }
  }
  
  const newRemaining = fee.amount - fee.paidAmount - fee.scholarshipAmount - (fee.lateFee || 0);
  if (fee.remainingAmount !== newRemaining) {
    fee.remainingAmount = newRemaining;
    hasUpdates = true;
  }

  // Update status based on payment
  let newStatus = fee.paymentStatus;
  if (fee.remainingAmount <= 0) {
    newStatus = 'Paid';
  } else if (fee.paidAmount > 0 && fee.remainingAmount > 0) {
    newStatus = 'Partial';
  } else if (new Date(fee.dueDate) < new Date() && fee.remainingAmount > 0) {
    newStatus = 'Overdue';
  }
  
  if (fee.paymentStatus !== newStatus) {
    fee.paymentStatus = newStatus;
    hasUpdates = true;
  }

  if (!hasUpdates) {
    return res.json({ 
      success: true, 
      data: fee,
      message: 'No changes detected'
    });
  }

  fee.updatedBy = userId;
  await fee.save();
  
  
  return res.json({ 
    success: true, 
    data: fee,
    message: 'Fee record updated successfully'
  });
});

// ==================== DELETE FEES ====================

// Delete fee
export const deleteFee = handle(async (req, res) => {
  const fee = await Fee.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!fee) {
    return res.status(404).json({ 
      success: false, 
      message: 'Fee record not found'
    });
  }

  await fee.deleteOne();
  
  return res.json({ 
    success: true, 
    message: 'Fee record deleted successfully' 
  });
});

// ==================== FEE STATISTICS ====================

// Get fee statistics
export const getFeeStats = handle(async (req, res) => {
  const total = await Fee.countDocuments({ isDeleted: { $ne: true } }) || 0;
  
  // Payment status counts
  const paid = await Fee.countDocuments({ paymentStatus: 'Paid', isDeleted: { $ne: true } }) || 0;
  const pending = await Fee.countDocuments({ paymentStatus: 'Pending', isDeleted: { $ne: true } }) || 0;
  const partial = await Fee.countDocuments({ paymentStatus: 'Partial', isDeleted: { $ne: true } }) || 0;
  const overdue = await Fee.countDocuments({ paymentStatus: 'Overdue', isDeleted: { $ne: true } }) || 0;
  const scholarship = await Fee.countDocuments({ paymentStatus: 'Scholarship', isDeleted: { $ne: true } }) || 0;

  // Financial totals
  const totalAmountAgg = await Fee.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const totalAmount = totalAmountAgg[0]?.total || 0;
  
  const totalPaidAgg = await Fee.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: null, total: { $sum: '$paidAmount' } } }
  ]);
  const totalPaid = totalPaidAgg[0]?.total || 0;
  
  const totalScholarshipAgg = await Fee.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: null, total: { $sum: '$scholarshipAmount' } } }
  ]);
  const totalScholarship = totalScholarshipAgg[0]?.total || 0;
  
  const totalLateFeeAgg = await Fee.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: null, total: { $sum: '$lateFee' } } }
  ]);
  const totalLateFee = totalLateFeeAgg[0]?.total || 0;

  // Fee type breakdown
  const feeTypeStats = await Fee.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: '$feeType', count: { $sum: 1 }, total: { $sum: '$amount' } } },
    { $sort: { count: -1 } }
  ]);

  // Fee structure usage
  const structureStats = await Fee.aggregate([
    { 
      $match: { feeStructureId: { $ne: null }, isDeleted: { $ne: true } }
    },
    { 
      $group: { 
        _id: '$feeStructureId', 
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      } 
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // Recent transactions (last 10)
  const recentTransactions = await Fee.find({ 
    paymentStatus: { $in: ['Paid', 'Partial'] },
    isDeleted: { $ne: true }
  })
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('studentName studentId amount paidAmount paymentMethod paymentStatus dueDate feeStructureName');

  return res.json({
    success: true,
    data: {
      total: total || 0,
      paid: paid || 0,
      pending: pending || 0,
      partial: partial || 0,
      overdue: overdue || 0,
      scholarship: scholarship || 0,
      totalAmount: totalAmount || 0,
      totalPaid: totalPaid || 0,
      totalScholarship: totalScholarship || 0,
      totalLateFee: totalLateFee || 0,
      feeTypeStats: feeTypeStats || [],
      structureStats: structureStats || [],
      recentTransactions: recentTransactions || []
    }
  });
});

// ==================== PAYMENT PROCESSING ====================

// Process payment
export const processPayment = handle(async (req, res) => {
  const { id } = req.params;
  const { amount, paymentMethod, transactionId, paymentReference } = req.body;
  
  
  const fee = await Fee.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!fee) {
    return res.status(404).json({ 
      success: false, 
      message: 'Fee record not found'
    });
  }

  if (fee.paymentStatus === 'Paid') {
    return res.status(400).json({
      success: false,
      message: 'Fee already paid'
    });
  }

  const paymentAmount = parseFloat(amount) || 0;
  if (paymentAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Payment amount must be greater than 0'
    });
  }

  // Update fee record
  fee.paidAmount = (fee.paidAmount || 0) + paymentAmount;
  fee.paymentMethod = paymentMethod || fee.paymentMethod || 'Cash';
  fee.transactionId = transactionId || fee.transactionId;
  fee.paymentReference = paymentReference || fee.paymentReference;
  fee.paidDate = new Date();
  
  // Update installment tracking
  if (fee.isInstallment && fee.installmentDetails && fee.installmentDetails.length > 0) {
    let remainingInstallment = fee.installmentPaid || 0;
    let paymentLeft = paymentAmount;
    
    for (let i = remainingInstallment; i < fee.installmentDetails.length && paymentLeft > 0; i++) {
      const installment = fee.installmentDetails[i];
      if (installment.status === 'Pending') {
        const paidForInstallment = Math.min(paymentLeft, installment.amount);
        installment.paidDate = new Date();
        installment.status = 'Paid';
        installment.transactionId = transactionId || installment.transactionId;
        paymentLeft -= paidForInstallment;
        remainingInstallment = i + 1;
      }
    }
    fee.installmentPaid = remainingInstallment;
  }
  
  // Recalculate remaining amount
  fee.remainingAmount = fee.amount - fee.paidAmount - (fee.scholarshipAmount || 0) - (fee.lateFee || 0);
  
  // Update status
  if (fee.remainingAmount <= 0) {
    fee.paymentStatus = 'Paid';
  } else if (fee.paidAmount > 0 && fee.remainingAmount > 0) {
    fee.paymentStatus = 'Partial';
  }

  await fee.save();

  
  return res.json({ 
    success: true, 
    data: fee,
    message: 'Payment of PKR ' + paymentAmount.toLocaleString() + ' processed successfully'
  });
});

// ==================== INVOICE GENERATION ====================

// Generate invoice
export const generateInvoice = handle(async (req, res) => {
  const { id } = req.params;
  
  
  const fee = await Fee.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!fee) {
    return res.status(404).json({ 
      success: false, 
      message: 'Fee record not found'
    });
  }

  if (fee.invoiceGenerated) {
    return res.status(400).json({
      success: false,
      message: 'Invoice already generated. Invoice #: ' + fee.invoiceNumber
    });
  }

  const invoiceNumber = 'INV-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  
  fee.invoiceNumber = invoiceNumber;
  fee.invoiceGenerated = true;
  fee.invoiceGeneratedDate = new Date();
  await fee.save();

  
  return res.json({ 
    success: true, 
    data: fee,
    message: 'Invoice ' + invoiceNumber + ' generated successfully'
  });
});

// ==================== LATE FEE MANAGEMENT ====================

// Apply late fee to overdue fees
export const applyLateFees = handle(async (req, res) => {
  const { percentage = 5 } = req.query;
  
  
  const overdueFees = await Fee.find({
    dueDate: { $lt: new Date() },
    paymentStatus: { $in: ['Pending', 'Partial'] },
    lateFeeApplied: false,
    remainingAmount: { $gt: 0 },
    isDeleted: { $ne: true }
  });

  let appliedCount = 0;
  let totalLateFeeApplied = 0;
  
  for (const fee of overdueFees) {
    const lateFeeAmount = (fee.remainingAmount * parseFloat(percentage)) / 100;
    fee.lateFee = lateFeeAmount;
    fee.lateFeeApplied = true;
    fee.lateFeeAppliedDate = new Date();
    
    // Update remaining amount
    fee.remainingAmount = fee.remainingAmount + lateFeeAmount;
    
    await fee.save();
    appliedCount++;
    totalLateFeeApplied += lateFeeAmount;
  }

  
  return res.json({ 
    success: true, 
    data: { 
      appliedCount: appliedCount,
      totalLateFeeApplied: parseFloat(totalLateFeeApplied.toFixed(2))
    },
    message: 'Late fees applied to ' + appliedCount + ' overdue fee records. Total: PKR ' + totalLateFeeApplied.toFixed(2)
  });
});

// Get late fee summary
export const getLateFeeSummary = handle(async (req, res) => {
  const totalLateFee = await Fee.aggregate([
    { $match: { lateFeeApplied: true, isDeleted: { $ne: true } } },
    { $group: { _id: null, total: { $sum: '$lateFee' } } }
  ]);
  
  const lateFeeStats = await Fee.aggregate([
    { $match: { lateFeeApplied: true, isDeleted: { $ne: true } } },
    { $group: { _id: '$paymentStatus', count: { $sum: 1 }, total: { $sum: '$lateFee' } } }
  ]);
  return res.json({
    success: true,
    data: {
      totalLateFee: totalLateFee[0]?.total || 0,
      breakdown: lateFeeStats
    }
  });
});
