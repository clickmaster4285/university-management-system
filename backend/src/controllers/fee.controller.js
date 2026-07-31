import mongoose from 'mongoose';
import Fee from '../models/Fee.js';

const getAuditUserId = (userId) => {
  if (!userId) return undefined;
  return mongoose.Types.ObjectId.isValid(userId) ? userId : undefined;
};

// Get all fees with filtering
export const getAllFees = async (req, res) => {
  try {
    const { 
      status, 
      studentId,
      studentName,
      search,
      fromDate,
      toDate,
      feeType,
      limit = 50, 
      page = 1 
    } = req.query;
    
    const query = {};
    if (status) query.paymentStatus = status;
    if (studentId) query.studentId = { $regex: studentId, $options: 'i' };
    if (studentName) query.studentName = { $regex: studentName, $options: 'i' };
    if (feeType) query.feeType = feeType;
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
        { invoiceNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [fees, total] = await Promise.all([
      Fee.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email'),
      Fee.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: fees || [],
      pagination: {
        total: total || 0,
        page: parseInt(page) || 1,
        pages: Math.ceil((total || 0) / parseInt(limit)) || 0,
        limit: parseInt(limit) || 50
      }
    });
  } catch (error) {
    console.error('Error fetching fees:', error);
    res.json({
      success: false,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        pages: 0,
        limit: 50
      },
      message: error.message || 'Failed to fetch fees'
    });
  }
};

// Get fee by ID
export const getFeeById = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    
    if (!fee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fee record not found',
        data: null
      });
    }
    
    res.json({ 
      success: true, 
      data: fee 
    });
  } catch (error) {
    console.error('Error fetching fee:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch fee record',
      error: error.message,
      data: null
    });
  }
};

// Create new fee - FIXED
export const createFee = async (req, res) => {
  try {
    console.log('📝 Creating fee with data:', req.body);
    
    // Required fields - removed studentRegistrationNo
    const requiredFields = ['studentId', 'studentName', 'studentEmail', 'department', 'program', 'semester', 'feeType', 'amount', 'dueDate'];
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '' || value === 0;
    });
    
    if (missingFields.length > 0) {
      console.log('❌ Missing fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        data: null
      });
    }

    // Get user ID from different possible sources
    const userId = getAuditUserId(req.user?._id || req.user?.userId || req.user?.id || null);

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
      createdBy: userId
    };

    // Calculate scholarship amount if percentage is provided
    if (feeData.isScholarship && feeData.scholarshipPercentage > 0) {
      feeData.scholarshipAmount = (feeData.amount * feeData.scholarshipPercentage) / 100;
    }

    console.log('📤 Processed fee data:', feeData);

    const fee = new Fee(feeData);
    await fee.save();
    
    console.log('✅ Fee created successfully:', fee.feeId);
    
    res.status(201).json({ 
      success: true, 
      data: fee,
      message: `Fee record created successfully. ID: ${fee.feeId}`
    });
  } catch (error) {
    console.error('❌ Error creating fee:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors,
        data: null
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create fee record',
      error: error.message,
      data: null
    });
  }
};

// Update fee - FIXED
export const updateFee = async (req, res) => {
  try {
    console.log('📝 Updating fee:', req.params.id);
    console.log('📝 Update data:', req.body);
    
    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fee record not found',
        data: null
      });
    }

    // Get user ID from different possible sources
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
    
    updateableFields.forEach(field => {
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
          if (value === '' || value === null || value === undefined) {
            // Keep existing value
          } else {
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
    
    const newRemaining = fee.amount - fee.paidAmount - fee.scholarshipAmount;
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
    
    console.log('✅ Fee updated successfully:', fee.feeId);
    
    res.json({ 
      success: true, 
      data: fee,
      message: 'Fee record updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating fee:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors,
        data: null
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update fee record',
      error: error.message,
      data: null
    });
  }
};

// Delete fee
export const deleteFee = async (req, res) => {
  try {
    console.log('📝 Deleting fee:', req.params.id);
    
    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fee record not found'
      });
    }

    await fee.deleteOne();
    console.log('✅ Fee deleted successfully:', fee.feeId);
    
    res.json({ 
      success: true, 
      message: 'Fee record deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting fee:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete fee record',
      error: error.message
    });
  }
};

// Get fee statistics - FIXED
export const getFeeStats = async (req, res) => {
  try {
    const total = await Fee.countDocuments() || 0;
    
    // Payment status counts
    const paid = await Fee.countDocuments({ paymentStatus: 'Paid' }) || 0;
    const pending = await Fee.countDocuments({ paymentStatus: 'Pending' }) || 0;
    const partial = await Fee.countDocuments({ paymentStatus: 'Partial' }) || 0;
    const overdue = await Fee.countDocuments({ paymentStatus: 'Overdue' }) || 0;
    const scholarship = await Fee.countDocuments({ paymentStatus: 'Scholarship' }) || 0;

    // Financial totals
    const totalAmountAgg = await Fee.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalAmount = totalAmountAgg[0]?.total || 0;
    
    const totalPaidAgg = await Fee.aggregate([
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);
    const totalPaid = totalPaidAgg[0]?.total || 0;
    
    const totalScholarshipAgg = await Fee.aggregate([
      { $group: { _id: null, total: { $sum: '$scholarshipAmount' } } }
    ]);
    const totalScholarship = totalScholarshipAgg[0]?.total || 0;
    
    const totalLateFeeAgg = await Fee.aggregate([
      { $group: { _id: null, total: { $sum: '$lateFee' } } }
    ]);
    const totalLateFee = totalLateFeeAgg[0]?.total || 0;

    // Fee type breakdown
    const feeTypeStats = await Fee.aggregate([
      { $group: { _id: '$feeType', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      { $sort: { count: -1 } }
    ]);

    // Recent transactions (last 10)
    const recentTransactions = await Fee.find({ 
      paymentStatus: { $in: ['Paid', 'Partial'] } 
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('studentName studentId amount paidAmount paymentMethod paymentStatus dueDate');

    res.json({
      success: true,
      data: {
        total,
        paid,
        pending,
        partial,
        overdue,
        scholarship,
        totalAmount,
        totalPaid,
        totalScholarship,
        totalLateFee,
        feeTypeStats,
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Error fetching fee stats:', error);
    res.json({
      success: false,
      data: {
        total: 0,
        paid: 0,
        pending: 0,
        partial: 0,
        overdue: 0,
        scholarship: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalScholarship: 0,
        totalLateFee: 0,
        feeTypeStats: [],
        recentTransactions: []
      },
      message: error.message || 'Failed to fetch statistics'
    });
  }
};

// Process payment - FIXED
export const processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, transactionId, paymentReference } = req.body;
    
    console.log('📝 Processing payment for fee:', id);
    console.log('📝 Payment data:', { amount, paymentMethod, transactionId });
    
    const fee = await Fee.findById(id);
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
    
    // Recalculate remaining amount
    fee.remainingAmount = fee.amount - fee.paidAmount - (fee.scholarshipAmount || 0);
    
    // Update status
    if (fee.remainingAmount <= 0) {
      fee.paymentStatus = 'Paid';
    } else if (fee.paidAmount > 0 && fee.remainingAmount > 0) {
      fee.paymentStatus = 'Partial';
    }

    await fee.save();

    console.log('✅ Payment processed successfully');
    
    res.json({ 
      success: true, 
      data: fee,
      message: `Payment of PKR ${paymentAmount.toLocaleString()} processed successfully`
    });
  } catch (error) {
    console.error('❌ Error processing payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process payment',
      error: error.message
    });
  }
};

// Generate invoice - FIXED
export const generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📝 Generating invoice for fee:', id);
    
    const fee = await Fee.findById(id);
    if (!fee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fee record not found'
      });
    }

    if (fee.invoiceGenerated) {
      return res.status(400).json({
        success: false,
        message: `Invoice already generated. Invoice #: ${fee.invoiceNumber}`
      });
    }

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    
    fee.invoiceNumber = invoiceNumber;
    fee.invoiceGenerated = true;
    fee.invoiceGeneratedDate = new Date();
    await fee.save();

    console.log('✅ Invoice generated:', invoiceNumber);
    
    res.json({ 
      success: true, 
      data: fee,
      message: `Invoice ${invoiceNumber} generated successfully`
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate invoice',
      error: error.message
    });
  }
};

// Apply late fee to overdue fees - FIXED
export const applyLateFees = async (req, res) => {
  try {
    const { percentage = 5 } = req.query;
    
    console.log('📝 Applying late fees with percentage:', percentage);
    
    const overdueFees = await Fee.find({
      dueDate: { $lt: new Date() },
      paymentStatus: { $in: ['Pending', 'Partial'] },
      lateFeeApplied: false,
      remainingAmount: { $gt: 0 }
    });

    let appliedCount = 0;
    let totalLateFeeApplied = 0;
    
    for (const fee of overdueFees) {
      const lateFeeAmount = (fee.remainingAmount * parseFloat(percentage)) / 100;
      fee.lateFee = lateFeeAmount;
      fee.lateFeeApplied = true;
      fee.lateFeeAppliedDate = new Date();
      await fee.save();
      appliedCount++;
      totalLateFeeApplied += lateFeeAmount;
    }

    console.log(`✅ Applied late fees to ${appliedCount} fee records, total: PKR ${totalLateFeeApplied.toFixed(2)}`);
    
    res.json({ 
      success: true, 
      data: { 
        appliedCount,
        totalLateFeeApplied: parseFloat(totalLateFeeApplied.toFixed(2))
      },
      message: `Late fees applied to ${appliedCount} overdue fee records. Total: PKR ${totalLateFeeApplied.toFixed(2)}`
    });
  } catch (error) {
    console.error('Error applying late fees:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to apply late fees',
      error: error.message
    });
  }
};