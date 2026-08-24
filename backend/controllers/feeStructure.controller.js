// backend/src/controllers/feeStructure.controller.js
import { handle } from "../utils/asyncHandler.js";

// Get all fee structures
import { FeeStructure } from "../models/index.js";
export const getAllFeeStructures = handle(async (req, res) => {
  const { department, program, semester, status, search, limit = 50, page = 1 } = req.query;
  
  const query = { isDeleted: { $ne: true } };
  if (department) query.department = department;
  if (program) query.program = program;
  if (semester) query.semester = parseInt(semester);
  if (status) query.status = status;
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } },
      { program: { $regex: search, $options: 'i' } },
      { structureId: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [structures, total] = await Promise.all([
    FeeStructure.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email'),
    FeeStructure.countDocuments(query)
  ]);

  return res.json({
    success: true,
    data: structures,
    pagination: {
      total: total || 0,
      page: parseInt(page) || 1,
      pages: Math.ceil((total || 0) / parseInt(limit)) || 0,
      limit: parseInt(limit) || 50
    }
  });
});

// Get fee structure by ID
export const getFeeStructureById = handle(async (req, res) => {
  const structure = await FeeStructure.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');
  
  if (!structure) {
    return res.status(404).json({
      success: false,
      message: 'Fee structure not found'
    });
  }
  
  return res.json({
    success: true,
    data: structure
  });
});

// Create fee structure
export const createFeeStructure = handle(async (req, res) => {
  const requiredFields = ['name', 'department', 'program', 'semester', 'academicYear'];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: ' + missingFields.join(', ')
    });
  }

  // Check if structure already exists
  const existing = await FeeStructure.findOne({
    department: req.body.department,
    program: req.body.program,
    semester: req.body.semester,
    academicYear: req.body.academicYear,
    status: { $ne: 'Archived' },
    isDeleted: { $ne: true }
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'Fee structure already exists for this program, semester, and academic year'
    });
  }

  const structureData = {
    ...req.body,
    createdBy: req.user?.id || null
  };

  const structure = new FeeStructure(structureData);
  await structure.save();


  return res.status(201).json({
    success: true,
    data: structure,
    message: 'Fee structure created successfully'
  });
});

// Update fee structure - FIXED
export const updateFeeStructure = handle(async (req, res) => {
  const { id } = req.params;
  
  const structure = await FeeStructure.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!structure) {
    return res.status(404).json({
      success: false,
      message: 'Fee structure not found'
    });
  }

  // Check for duplicates
  if (req.body.department || req.body.program || req.body.semester || req.body.academicYear) {
    const existing = await FeeStructure.findOne({
      department: req.body.department || structure.department,
      program: req.body.program || structure.program,
      semester: req.body.semester || structure.semester,
      academicYear: req.body.academicYear || structure.academicYear,
      _id: { $ne: id },
      status: { $ne: 'Archived' },
      isDeleted: { $ne: true }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Fee structure already exists for this program, semester, and academic year'
      });
    }
  }

  // Update fields
  const updateableFields = [
    'name', 'department', 'program', 'semester', 'studentCategory',
    'academicYear', 'status', 'effectiveFrom', 'effectiveTo',
    'calculationMethod', 'courses', 'additionalFees',
    'discountEnabled', 'discount', 'lateFeeEnabled', 'lateFee',
    'paymentType', 'installments', 'notes'
  ];

  let hasUpdates = false;
  updateableFields.forEach(field => {
    if (req.body[field] !== undefined) {
      structure[field] = req.body[field];
      hasUpdates = true;
    }
  });

  // Recalculate totals if courses or additional fees changed
  if (req.body.courses || req.body.additionalFees || req.body.discountEnabled || req.body.discount) {
    const totalCourseFee = (structure.courses || []).reduce((sum, c) => sum + c.totalFee, 0);
    const totalAdditionalFee = (structure.additionalFees || []).reduce((sum, fee) => {
      if (fee.type === 'Fixed') {
        return sum + fee.amount;
      } else {
        return sum + (totalCourseFee * fee.percentage / 100);
      }
    }, 0);
    const grossTotal = totalCourseFee + totalAdditionalFee;
    
    let discountAmount = 0;
    if (structure.discountEnabled && structure.discount && structure.discount.value > 0) {
      const applicableAmount = structure.discount.applicableTo === 'Tuition Fee' 
        ? totalCourseFee 
        : grossTotal;
      discountAmount = structure.discount.type === 'Percentage'
        ? (applicableAmount * structure.discount.value / 100)
        : structure.discount.value;
    }
    
    structure.totalCourseFee = totalCourseFee;
    structure.totalAdditionalFee = totalAdditionalFee;
    structure.grossTotal = grossTotal;
    structure.discountAmount = discountAmount;
    structure.finalPayable = grossTotal - discountAmount;
    
    hasUpdates = true;
  }

  if (!hasUpdates) {
    return res.json({
      success: true,
      data: structure,
      message: 'No changes detected'
    });
  }

  structure.updatedBy = req.user?.id || null;
  await structure.save();


  return res.json({
    success: true,
    data: structure,
    message: 'Fee structure updated successfully'
  });
});

// Delete fee structure
export const deleteFeeStructure = handle(async (req, res) => {
  const { id } = req.params;
  
  const structure = await FeeStructure.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!structure) {
    return res.status(404).json({
      success: false,
      message: 'Fee structure not found'
    });
  }

  // Soft delete - mark as archived
  structure.status = 'Archived';
  structure.isActive = false;
  structure.updatedBy = req.user?.id || null;
  await structure.save();

  return res.json({
    success: true,
    message: 'Fee structure deleted successfully'
  });
});

// Get fee structure by program and semester
export const getFeeStructureByProgram = handle(async (req, res) => {
  const { program, semester } = req.params;
  
  const structures = await FeeStructure.find({
    program,
    semester: parseInt(semester),
    status: 'Active',
    isActive: true,
    isDeleted: { $ne: true }
  }).sort({ createdAt: -1 });

  return res.json({
    success: true,
    data: structures
  });
});
