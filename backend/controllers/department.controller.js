// backend/src/controllers/department.controller.js
import mongoose from 'mongoose';
import Department from '../models/academic/Department.js';

// GET /api/departments - Get all departments
export async function getDepartments(req, res, next) {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const departments = await Department.find(filter)
      .sort({ name: 1 })
      .select('-__v');
    
    res.json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (err) {
    console.error('Error fetching departments:', err);
    next(err);
  }
}

async function findDepartmentByIdentifier(identifier) {
  const query = [{ departmentId: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query.unshift({ _id: identifier });
  }
  return Department.findOne({ $or: query });
}

// GET /api/departments/:id - Get department by ID
export async function getDepartmentById(req, res, next) {
  try {
    const department = await findDepartmentByIdentifier(req.params.id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    
    res.json({ success: true, data: department });
  } catch (err) {
    console.error('Error fetching department:', err);
    next(err);
  }
}

// POST /api/departments - Create new department
export async function createDepartment(req, res, next) {
  try {
    const { 
      name, 
      code, 
      description, 
      head, 
      faculty, 
      email, 
      phone, 
      establishedDate,
      facultyCount, 
      studentCount, 
      status, 
      location 
    } = req.body;
    
    
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Name and code are required'
      });
    }
    
    // Check for existing department
    const existing = await Department.findOne({ 
      $or: [{ name: name.trim() }, { code: code.toUpperCase().trim() }] 
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name or code already exists'
      });
    }
    
    const department = new Department({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      description: description || '',
      head: head || '',
      faculty: faculty || '',
      email: email || '',
      phone: phone || '',
      establishedDate: establishedDate ? new Date(establishedDate) : null,
      facultyCount: Number(facultyCount) || 0,
      studentCount: Number(studentCount) || 0,
      status: status || 'Active',
      location: location || ''
    });
    
    await department.save();
    
    
    res.status(201).json({
      success: true,
      data: department,
      message: 'Department created successfully'
    });
  } catch (err) {
    console.error('❌ Error creating department:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(function(e) { return e.message; });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    next(err);
  }
}

// PUT /api/departments/:id - Update department
export async function updateDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const { 
      name, 
      code, 
      description, 
      status, 
      head, 
      faculty,
      email,
      phone,
      establishedDate,
      facultyCount, 
      studentCount, 
      location 
    } = req.body;
    
    
    // Find the department by Mongo _id or departmentId
    const department = await findDepartmentByIdentifier(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    
    // Update name if provided
    if (name !== undefined && name !== '') {
      const trimmedName = name.trim();
      const existing = await Department.findOne({ 
        name: trimmedName, 
        _id: { $ne: department._id } 
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Department name already exists'
        });
      }
      department.name = trimmedName;
    }
    
    // Update code if provided
    if (code !== undefined && code !== '') {
      const trimmedCode = code.toUpperCase().trim();
      const existing = await Department.findOne({ 
        code: trimmedCode, 
        _id: { $ne: department._id } 
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Department code already exists'
        });
      }
      department.code = trimmedCode;
    }
    
    // Update description if provided
    if (description !== undefined) {
      department.description = description;
    }
    
    // Update status if provided
    if (status !== undefined && status !== '') {
      department.status = status;
    }
    
    // Update head if provided
    if (head !== undefined) {
      department.head = head;
    }
    
    // Update faculty if provided
    if (faculty !== undefined) {
      department.faculty = faculty;
    }
    
    // Update email if provided
    if (email !== undefined) {
      department.email = email;
    }
    
    // Update phone if provided
    if (phone !== undefined) {
      department.phone = phone;
    }
    
    // Update establishedDate if provided
    if (establishedDate !== undefined) {
      department.establishedDate = establishedDate ? new Date(establishedDate) : null;
    }
    
    // Update faculty count if provided
    if (facultyCount !== undefined) {
      department.facultyCount = Number(facultyCount) || 0;
    }
    
    // Update student count if provided
    if (studentCount !== undefined) {
      department.studentCount = Number(studentCount) || 0;
    }
    
    // Update location if provided
    if (location !== undefined) {
      department.location = location;
    }
    
    // Save the department
    await department.save();
    
    
    res.json({
      success: true,
      data: department,
      message: 'Department updated successfully'
    });
  } catch (err) {
    console.error('❌ Error updating department:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(function(e) { return e.message; });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    next(err);
  }
}

// DELETE /api/departments/:id - Delete department
export async function deleteDepartment(req, res, next) {
  try {
    const { id } = req.params;
    
    
    const department = await findDepartmentByIdentifier(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    
    // Check if department has courses
    let Course;
    try {
      const module = await import('../models/academic/Course.js');
      Course = module.default;
    } catch (err) {
      console.warn('Course model not found, skipping course check');
    }
    
    if (Course) {
      const courseCount = await Course.countDocuments({ departmentName: department.name });
      if (courseCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete department with ' + courseCount + ' courses. Remove courses first or deactivate the department.',
          courseCount: courseCount
        });
      }
    }
    
    await department.deleteOne();
    
    
    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (err) {
    console.error('❌ Error deleting department:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid department ID format'
      });
    }
    next(err);
  }
}

// GET /api/departments/stats - Get department statistics
export async function getDepartmentStats(req, res, next) {
  try {
    let Course;
    try {
      const module = await import('../models/academic/Course.js');
      Course = module.default;
    } catch (err) {
      console.warn('Course model not found, returning basic stats');
    }
    
    const stats = await Department.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'name',
          foreignField: 'departmentName',
          as: 'courses'
        }
      },
      {
        $project: {
          name: 1,
          code: 1,
          isActive: 1,
          courseCount: { $size: '$courses' },
          totalStudents: { $sum: '$courses.enrolledStudents' },
          totalCredits: { $sum: '$courses.credits' }
        }
      },
      { $sort: { courseCount: -1 } }
    ]);
    
    const totalDepartments = await Department.countDocuments();
    const activeDepartments = await Department.countDocuments({ isActive: true });
    
    res.json({
      success: true,
      data: {
        total: totalDepartments,
        active: activeDepartments,
        inactive: totalDepartments - activeDepartments,
        departments: stats
      }
    });
  } catch (err) {
    console.error('Error fetching department stats:', err);
    next(err);
  }
}