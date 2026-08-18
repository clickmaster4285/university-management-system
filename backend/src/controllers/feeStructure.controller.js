// backend/src/controllers/feeStructure.controller.js
import FeeStructure from '../models/FeeStructure.js';

// Get all fee structures
export const getAllFeeStructures = async (req, res) => {
  try {
    const { department, program, semester, status, search, limit = 50, page = 1 } = req.query;
    
    const query = {};
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

    res.json({
      success: true,
      data: structures,
      pagination: {
        total: total || 0,
        page: parseInt(page) || 1,
        pages: Math.ceil((total || 0) / parseInt(limit)) || 0,
        limit: parseInt(limit) || 50
      }
    });
  } catch (error) {
    console.error('Error fetching fee structures:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fee structures',
      error: error.message
    });
  }
};

// Get fee structure by ID
export const getFeeStructureById = async (req, res) => {
  try {
    const structure = await FeeStructure.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    if (!structure) {
      return res.status(404).json({
        success: false,
        message: 'Fee structure not found'
      });
    }
    
    res.json({
      success: true,
      data: structure
    });
  } catch (error) {
    console.error('Error fetching fee structure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fee structure',
      error: error.message
    });
  }
};

// Create fee structure
export const createFeeStructure = async (req, res) => {
  try {
    console.log('📝 Creating fee structure:', req.body);
    
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
      status: { $ne: 'Archived' }
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

    console.log('✅ Fee structure created:', structure.structureId);

    res.status(201).json({
      success: true,
      data: structure,
      message: 'Fee structure created successfully'
    });
  } catch (error) {
    console.error('Error creating fee structure:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create fee structure',
      error: error.message
    });
  }
};

// Update fee structure - FIXED
export const updateFeeStructure = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📝 Updating fee structure:', id);
    console.log('📝 Update data:', req.body);
    
    const structure = await FeeStructure.findById(id);
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
        status: { $ne: 'Archived' }
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

    console.log('✅ Fee structure updated:', structure.structureId);

    res.json({
      success: true,
      data: structure,
      message: 'Fee structure updated successfully'
    });
  } catch (error) {
    console.error('Error updating fee structure:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update fee structure',
      error: error.message
    });
  }
};

// Delete fee structure
export const deleteFeeStructure = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting fee structure:', id);
    
    const structure = await FeeStructure.findById(id);
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

    res.json({
      success: true,
      message: 'Fee structure deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting fee structure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete fee structure',
      error: error.message
    });
  }
};

// Get fee structure by program and semester
export const getFeeStructureByProgram = async (req, res) => {
  try {
    const { program, semester } = req.params;
    
    const structures = await FeeStructure.find({
      program,
      semester: parseInt(semester),
      status: 'Active',
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: structures
    });
  } catch (error) {
    console.error('Error fetching fee structure by program:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fee structure',
      error: error.message
    });
  }
};