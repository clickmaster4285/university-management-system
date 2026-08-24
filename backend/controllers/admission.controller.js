import { handle } from "../utils/asyncHandler.js";

// Get all admissions with filtering and pagination
import { Admission } from "../models/index.js";
export const getAllAdmissions = handle(async (req, res) => {
  const { status, program, department, search, limit = 50, page = 1 } = req.query;
  
  const query = { isDeleted: { $ne: true } };
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
});

// Get single admission by ID
export const getAdmissionById = handle(async (req, res) => {
  const admission = await Admission.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
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
});

// Create new admission
export const createAdmission = handle(async (req, res) => {
  // Validate required fields
  const requiredFields = ['name', 'fatherName', 'email', 'phone', 'cnic', 'program', 'department', 'campus'];
  const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field] === '');
  
  if (missingFields.length > 0) {
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
      $or: conditions,
      isDeleted: { $ne: true }
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

  // Generate admission ID
  const year = new Date().getFullYear();
  const count = await Admission.countDocuments({ isDeleted: { $ne: true } });
  const admissionId = `ADM-${year}-${String(count + 1).padStart(4, '0')}`;

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
  
  const admission = new Admission(cleanData);
  await admission.save();
  
  
  res.status(201).json({ 
    success: true, 
    data: admission,
    message: `Admission application submitted successfully. ID: ${admission.admissionId}`
  });
});

// Update admission
export const updateAdmission = handle(async (req, res) => {
  const admission = await Admission.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
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
      $or: conditions,
      isDeleted: { $ne: true }
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
  
  res.json({ 
    success: true, 
    data: admission,
    message: 'Admission application updated successfully'
  });
});

// Update admission status
export const updateAdmissionStatus = handle(async (req, res) => {
  const { status, remarks, rejectionReason, interviewDate } = req.body;
  
  
  const admission = await Admission.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
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
  
  
  res.json({ 
    success: true, 
    data: admission,
    message: `Application status updated to ${status}`
  });
});

// Delete admission
export const deleteAdmission = handle(async (req, res) => {
  const admission = await Admission.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!admission) {
    return res.status(404).json({ 
      success: false, 
      message: 'Admission not found' 
    });
  }

  await admission.deleteOne();
  
  res.json({ 
    success: true, 
    message: 'Admission application deleted successfully' 
  });
});

// Get admission statistics
export const getAdmissionStats = handle(async (req, res) => {
  const stats = await Admission.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const total = await Admission.countDocuments({ isDeleted: { $ne: true } });
  const pending = await Admission.countDocuments({ status: 'Pending', isDeleted: { $ne: true } });
  const accepted = await Admission.countDocuments({ status: 'Accepted', isDeleted: { $ne: true } });
  const rejected = await Admission.countDocuments({ status: 'Rejected', isDeleted: { $ne: true } });
  const underReview = await Admission.countDocuments({ status: 'Under Review', isDeleted: { $ne: true } });


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
});

// Get admissions by program
export const getAdmissionsByProgram = handle(async (req, res) => {
  const { program } = req.params;
  
  const admissions = await Admission.find({ program, isDeleted: { $ne: true } })
    .sort({ applicationDate: -1 });
  
  res.json({
    success: true,
    data: admissions,
    count: admissions.length
  });
});

// Get admissions by date range
export const getAdmissionsByDateRange = handle(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const query = { isDeleted: { $ne: true } };
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
});

// Get admission statistics by department
export const getAdmissionStatsByDepartment = handle(async (req, res) => {
  const stats = await Admission.aggregate([
    { $match: { isDeleted: { $ne: true } } },
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
});

// Get recent admissions
export const getRecentAdmissions = handle(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const admissions = await Admission.find({ isDeleted: { $ne: true } })
    .sort({ applicationDate: -1 })
    .limit(parseInt(limit))
    .populate('admissionOfficer', 'name email');
  
  res.json({
    success: true,
    data: admissions,
    count: admissions.length
  });
});
