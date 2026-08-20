import Teacher from '../models/academic/Teacher.js';

// GET /api/teachers
export async function getTeachers(req, res, next) {
  try {
    const { 
      department, 
      designation, 
      status, 
      search, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    const filter = {};
    if (department) filter.department = department;
    if (designation) filter.designation = designation;
    if (status) filter.status = status;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const teachers = await Teacher.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .select('-__v');

    const totalCount = await Teacher.countDocuments(filter);

    res.json({
      success: true,
      count: teachers.length,
      total: totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      data: teachers
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/teachers/:id - Use MongoDB _id
export async function getTeacherById(req, res, next) {
  try {
    // Use findById with MongoDB _id
    const teacher = await Teacher.findById(req.params.id)
      .select('-__v');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: `Teacher ${req.params.id} not found`
      });
    }
    
    res.json({ success: true, data: teacher });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher ID format'
      });
    }
    next(err);
  }
}

// POST /api/teachers
export async function createTeacher(req, res, next) {
  try {
    const { name, department, designation, email } = req.body;
    
    if (!name || !department || !designation) {
      return res.status(400).json({
        success: false,
        message: "name, department and designation are required fields",
      });
    }

    if (email) {
      const existingEmail = await Teacher.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: `Teacher with email ${email} already exists`
        });
      }
    }

    const teacherData = {
      name,
      department,
      designation,
      email: email || "",
      phone: req.body.phone || "",
      specialization: req.body.specialization || "",
      experience: req.body.experience ?? 0,
      rating: req.body.rating ?? 0,
      salary: req.body.salary ?? 0,
      status: req.body.status ?? "Active",
      officeHours: req.body.officeHours || "",
      qualifications: req.body.qualifications || []
    };

    const teacher = new Teacher(teacherData);
    await teacher.save();

    res.status(201).json({
      success: true,
      data: teacher
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate ${field}. Please use a unique value.`
      });
    }
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    next(err);
  }
}

// PUT /api/teachers/:id - Use MongoDB _id
export async function updateTeacher(req, res, next) {
  try {
    const { id } = req.params;
    
    // Check if teacher exists using MongoDB _id
    const existingTeacher = await Teacher.findById(id);
    if (!existingTeacher) {
      return res.status(404).json({
        success: false,
        message: `Teacher ${id} not found`
      });
    }

    // Check for duplicate email (if updating)
    if (req.body.email) {
      const duplicateEmail = await Teacher.findOne({
        email: req.body.email,
        _id: { $ne: id }
      });
      if (duplicateEmail) {
        return res.status(400).json({
          success: false,
          message: `Teacher with email ${req.body.email} already exists`
        });
      }
    }

    // Remove id from body if present
    const { _id, ...updateData } = req.body;
    
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-__v');

    res.json({
      success: true,
      data: updatedTeacher
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher ID format'
      });
    }
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    next(err);
  }
}

// DELETE /api/teachers/:id - Use MongoDB _id
export async function deleteTeacher(req, res, next) {
  try {
    const { id } = req.params;
    
    // Use findByIdAndDelete with MongoDB _id
    const teacher = await Teacher.findByIdAndDelete(id);
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: `Teacher ${id} not found`
      });
    }

    res.json({
      success: true,
      message: "Teacher deleted successfully",
      data: teacher
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher ID format'
      });
    }
    next(err);
  }
}

// BULK CREATE /api/teachers/bulk
export async function bulkCreateTeachers(req, res, next) {
  try {
    const teachers = req.body.teachers || req.body;
    
    if (!Array.isArray(teachers)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of teachers'
      });
    }

    if (teachers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Teacher array cannot be empty'
      });
    }

    const invalidTeachers = teachers.filter(t => !t.name || !t.department || !t.designation);
    if (invalidTeachers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Each teacher must have name, department and designation',
        invalidCount: invalidTeachers.length
      });
    }

    const createdTeachers = await Teacher.insertMany(teachers);
    
    res.status(201).json({
      success: true,
      count: createdTeachers.length,
      data: createdTeachers
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate key error. Check for duplicate emails',
        error: err.message
      });
    }
    next(err);
  }
}

// GET /api/teachers/stats
export async function getTeacherStats(req, res, next) {
  try {
    const stats = await Teacher.aggregate([
      {
        $group: {
          _id: null,
          totalTeachers: { $sum: 1 },
          averageExperience: { $avg: '$experience' },
          averageRating: { $avg: '$rating' },
          averageSalary: { $avg: '$salary' }
        }
      }
    ]);

    const deptStats = await Teacher.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          avgExperience: { $avg: '$experience' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const designationStats = await Teacher.aggregate([
      {
        $group: {
          _id: '$designation',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const statusStats = await Teacher.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overall: stats[0] || {
          totalTeachers: 0,
          averageExperience: 0,
          averageRating: 0,
          averageSalary: 0
        },
        byDepartment: deptStats,
        byDesignation: designationStats,
        byStatus: statusStats
      }
    });
  } catch (err) {
    next(err);
  }
}