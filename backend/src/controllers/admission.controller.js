import Admission from '../models/Admission.js';

// Get all admissions with filtering and pagination
export const getAllAdmissions = async (req, res) => {
  try {
    const { status, program, department, search, limit = 50, page = 1 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (program) query.program = program;
    if (department) query.department = department;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { admissionId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [admissions, total] = await Promise.all([
      Admission.find(query)
        .sort({ applicationDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('admissionOfficer', 'name email'),
      Admission.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: admissions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admissions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch admissions',
      error: error.message 
    });
  }
};

// Get single admission by ID
export const getAdmissionById = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id)
      .populate('admissionOfficer', 'name email');
    
    if (!admission) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admission not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: admission 
    });
  } catch (error) {
    console.error('Error fetching admission:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch admission',
      error: error.message 
    });
  }
};

// Create new admission
export const createAdmission = async (req, res) => {
  try {
    console.log('📝 Creating admission with data:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    const requiredFields = ['name', 'fatherName', 'email', 'phone', 'cnic', 'program', 'department', 'campus'];
    const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field] === '');
    
    if (missingFields.length > 0) {
      console.log('❌ Missing fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Check for duplicates
    const { email, cnic, phone } = req.body;
    const conditions = [];
    if (email) conditions.push({ email });
    if (cnic) conditions.push({ cnic });
    if (phone) conditions.push({ phone });
    
    if (conditions.length > 0) {
      const existing = await Admission.findOne({
        $or: conditions
      });

      if (existing) {
        let message = 'Duplicate entry found. ';
        if (existing.email === email) message += 'Email already exists. ';
        if (existing.cnic === cnic) message += 'CNIC already exists. ';
        if (existing.phone === phone) message += 'Phone number already exists. ';
        console.log('❌ Duplicate found:', message);
        return res.status(400).json({ 
          success: false, 
          message: message.trim() 
        });
      }
    }

    // Generate admission ID
    const year = new Date().getFullYear();
    const count = await Admission.countDocuments();
    const admissionId = `ADM-${year}-${String(count + 1).padStart(4, '0')}`;
    console.log('📋 Generated Admission ID:', admissionId);

    // Clean and prepare the data
    const cleanData = {
      name: req.body.name.trim(),
      fatherName: req.body.fatherName.trim(),
      motherName: req.body.motherName?.trim() || '',
      cnic: req.body.cnic.trim(),
      dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null,
      gender: req.body.gender || '',
      nationality: req.body.nationality || 'Pakistani',
      religion: req.body.religion || 'Islam',
      email: req.body.email.trim().toLowerCase(),
      phone: req.body.phone.trim(),
      address: req.body.address?.trim() || '',
      city: req.body.city?.trim() || '',
      state: req.body.state?.trim() || '',
      postalCode: req.body.postalCode?.trim() || '',
      country: req.body.country || 'Pakistan',
      program: req.body.program,
      department: req.body.department,
      semester: parseInt(req.body.semester) || 1,
      academicYear: req.body.academicYear || new Date().getFullYear().toString(),
      previousEducation: {
        institution: req.body.previousEducation?.institution?.trim() || '',
        degree: req.body.previousEducation?.degree?.trim() || '',
        grade: req.body.previousEducation?.grade?.trim() || '',
        yearOfCompletion: parseInt(req.body.previousEducation?.yearOfCompletion) || 0,
        percentage: parseFloat(req.body.previousEducation?.percentage) || 0
      },
      status: req.body.status || 'Pending',
      campus: req.body.campus,
      applicationFee: parseFloat(req.body.applicationFee) || 0,
      feeStatus: req.body.feeStatus || 'Pending',
      admissionId: admissionId,
      applicationDate: new Date()
    };

    console.log('📤 Clean data being saved:', JSON.stringify(cleanData, null, 2));

    const admission = new Admission(cleanData);
    await admission.save();
    
    console.log('✅ Admission created successfully:', admission.admissionId);
    
    res.status(201).json({ 
      success: true, 
      data: admission,
      message: `Admission application submitted successfully. ID: ${admission.admissionId}`
    });
  } catch (error) {
    console.error('❌ Error creating admission:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldName = field === 'cnic' ? 'CNIC' : field === 'email' ? 'Email' : field === 'phone' ? 'Phone number' : field;
      return res.status(409).json({
        success: false,
        message: `${fieldName} already exists. Please use a unique ${fieldName}.`
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    // Handle other errors
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create admission',
      error: error.message 
    });
  }
};

// Update admission
export const updateAdmission = async (req, res) => {
  try {
    console.log('📝 Updating admission:', req.params.id);
    console.log('📝 Update data:', JSON.stringify(req.body, null, 2));
    
    const admission = await Admission.findById(req.params.id);
    if (!admission) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admission not found' 
      });
    }

    // Check for duplicates excluding current
    const { email, cnic, phone } = req.body;
    const conditions = [];
    if (email) conditions.push({ email, _id: { $ne: req.params.id } });
    if (cnic) conditions.push({ cnic, _id: { $ne: req.params.id } });
    if (phone) conditions.push({ phone, _id: { $ne: req.params.id } });

    if (conditions.length > 0) {
      const existing = await Admission.findOne({
        $or: conditions
      });
      
      if (existing) {
        let message = 'Duplicate entry found. ';
        if (existing.email === email) message += 'Email already exists. ';
        if (existing.cnic === cnic) message += 'CNIC already exists. ';
        if (existing.phone === phone) message += 'Phone number already exists. ';
        return res.status(400).json({ 
          success: false, 
          message: message.trim() 
        });
      }
    }

    // Update fields
    const updateableFields = [
      'name', 'fatherName', 'motherName', 'cnic', 'dateOfBirth', 'gender',
      'nationality', 'religion', 'email', 'phone', 'address', 'city', 'state',
      'postalCode', 'country', 'program', 'department', 'semester', 'academicYear',
      'status', 'campus', 'applicationFee', 'feeStatus', 'remarks', 'rejectionReason'
    ];
    
    updateableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'email') {
          admission[field] = req.body[field].trim().toLowerCase();
        } else if (field === 'cnic' || field === 'phone' || field === 'name' || field === 'fatherName') {
          admission[field] = req.body[field].trim();
        } else if (field === 'semester' || field === 'applicationFee') {
          admission[field] = parseFloat(req.body[field]) || 0;
        } else {
          admission[field] = req.body[field];
        }
      }
    });

    // Update previousEducation separately
    if (req.body.previousEducation) {
      admission.previousEducation = {
        ...admission.previousEducation,
        ...req.body.previousEducation
      };
    }
    
    await admission.save();
    console.log('✅ Admission updated successfully:', admission.admissionId);
    
    res.json({ 
      success: true, 
      data: admission,
      message: 'Admission application updated successfully'
    });
  } catch (error) {
    console.error('Error updating admission:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldName = field === 'cnic' ? 'CNIC' : field === 'email' ? 'Email' : field === 'phone' ? 'Phone number' : field;
      return res.status(409).json({
        success: false,
        message: `${fieldName} already exists. Please use a unique ${fieldName}.`
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update admission',
      error: error.message 
    });
  }
};

// Update admission status
export const updateAdmissionStatus = async (req, res) => {
  try {
    const { status, remarks, rejectionReason, interviewDate } = req.body;
    
    console.log('📝 Updating status for admission:', req.params.id, 'to', status);
    
    const admission = await Admission.findById(req.params.id);
    if (!admission) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admission not found' 
      });
    }

    admission.status = status;
    if (remarks) admission.remarks = remarks;
    if (rejectionReason) admission.rejectionReason = rejectionReason;

    // Update dates based on status
    if (status === 'Under Review') {
      admission.reviewDate = new Date();
    } else if (status === 'Interview Scheduled' && interviewDate) {
      admission.interviewDate = new Date(interviewDate);
    } else if (['Accepted', 'Rejected'].includes(status)) {
      admission.decisionDate = new Date();
    }

    await admission.save();
    
    console.log('✅ Status updated successfully:', status);
    
    res.json({ 
      success: true, 
      data: admission,
      message: `Application status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating admission status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update status',
      error: error.message 
    });
  }
};

// Delete admission
export const deleteAdmission = async (req, res) => {
  try {
    console.log('📝 Deleting admission:', req.params.id);
    
    const admission = await Admission.findById(req.params.id);
    if (!admission) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admission not found' 
      });
    }

    await admission.deleteOne();
    console.log('✅ Admission deleted successfully:', admission.admissionId);
    
    res.json({ 
      success: true, 
      message: 'Admission application deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting admission:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete admission',
      error: error.message 
    });
  }
};

// Get admission statistics
export const getAdmissionStats = async (req, res) => {
  try {
    console.log('📊 Fetching admission statistics');
    
    const stats = await Admission.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Admission.countDocuments();
    const pending = await Admission.countDocuments({ status: 'Pending' });
    const accepted = await Admission.countDocuments({ status: 'Accepted' });
    const rejected = await Admission.countDocuments({ status: 'Rejected' });
    const underReview = await Admission.countDocuments({ status: 'Under Review' });

    console.log('📊 Statistics:', { total, pending, accepted, rejected, underReview });

    res.json({
      success: true,
      data: {
        total,
        pending,
        accepted,
        rejected,
        underReview,
        byStatus: stats
      }
    });
  } catch (error) {
    console.error('Error fetching admission stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch statistics',
      error: error.message 
    });
  }
};

// Get admissions by program
export const getAdmissionsByProgram = async (req, res) => {
  try {
    const { program } = req.params;
    console.log('📝 Fetching admissions for program:', program);
    
    const admissions = await Admission.find({ program })
      .sort({ applicationDate: -1 });
    
    res.json({
      success: true,
      data: admissions,
      count: admissions.length
    });
  } catch (error) {
    console.error('Error fetching admissions by program:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch admissions',
      error: error.message 
    });
  }
};

// Get admissions by date range
export const getAdmissionsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    console.log('📝 Fetching admissions by date range:', { startDate, endDate });
    
    const query = {};
    if (startDate || endDate) {
      query.applicationDate = {};
      if (startDate) query.applicationDate.$gte = new Date(startDate);
      if (endDate) query.applicationDate.$lte = new Date(endDate);
    }
    
    const admissions = await Admission.find(query)
      .sort({ applicationDate: -1 });
    
    res.json({
      success: true,
      data: admissions,
      count: admissions.length
    });
  } catch (error) {
    console.error('Error fetching admissions by date:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch admissions',
      error: error.message 
    });
  }
};

// Get admission statistics by department
export const getAdmissionStatsByDepartment = async (req, res) => {
  try {
    console.log('📊 Fetching admission statistics by department');
    
    const stats = await Admission.aggregate([
      {
        $group: {
          _id: {
            department: '$department',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.department',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching department stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch department statistics',
      error: error.message 
    });
  }
};

// Get recent admissions
export const getRecentAdmissions = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    console.log('📝 Fetching recent admissions, limit:', limit);
    
    const admissions = await Admission.find({})
      .sort({ applicationDate: -1 })
      .limit(parseInt(limit))
      .populate('admissionOfficer', 'name email');
    
    res.json({
      success: true,
      data: admissions,
      count: admissions.length
    });
  } catch (error) {
    console.error('Error fetching recent admissions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch recent admissions',
      error: error.message 
    });
  }
};