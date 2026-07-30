import Department from '../models/Department.js';

// GET /api/departments
export async function getDepartments(req, res, next) {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const departments = await Department.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 })
      .select('-__v');

    const totalCount = await Department.countDocuments(filter);

    res.json({
      success: true,
      count: departments.length,
      total: totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      data: departments
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/departments/:id
export async function getDepartmentById(req, res, next) {
  try {
    const department = await Department.findOne({ departmentId: req.params.id });
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: `Department ${req.params.id} not found`
      });
    }
    
    res.json({ success: true, data: department });
  } catch (err) {
    next(err);
  }
}

// POST /api/departments
export async function createDepartment(req, res, next) {
  try {
    const { name, code } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Name and code are required fields"
      });
    }

    // Check for duplicate name
    const existingName = await Department.findOne({ name });
    if (existingName) {
      return res.status(400).json({
        success: false,
        message: `Department with name ${name} already exists`
      });
    }

    // Check for duplicate code
    const existingCode = await Department.findOne({ code });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: `Department with code ${code} already exists`
      });
    }

    const department = new Department(req.body);
    await department.save();

    res.status(201).json({
      success: true,
      data: department
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

// PUT /api/departments/:id
export async function updateDepartment(req, res, next) {
  try {
    const { id } = req.params;
    
    const existing = await Department.findOne({ departmentId: id });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Department ${id} not found`
      });
    }

    // Check duplicate name
    if (req.body.name) {
      const duplicate = await Department.findOne({
        name: req.body.name,
        departmentId: { $ne: id }
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Department with name ${req.body.name} already exists`
        });
      }
    }

    // Check duplicate code
    if (req.body.code) {
      const duplicate = await Department.findOne({
        code: req.body.code,
        departmentId: { $ne: id }
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Department with code ${req.body.code} already exists`
        });
      }
    }

    const { departmentId, ...updateData } = req.body;
    
    const department = await Department.findOneAndUpdate(
      { departmentId: id },
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    res.json({
      success: true,
      data: department
    });
  } catch (err) {
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

// DELETE /api/departments/:id
export async function deleteDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const department = await Department.findOneAndDelete({ departmentId: id });
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: `Department ${id} not found`
      });
    }

    res.json({
      success: true,
      message: "Department deleted successfully",
      data: department
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/departments/stats
export async function getDepartmentStats(req, res, next) {
  try {
    const total = await Department.countDocuments();
    const active = await Department.countDocuments({ status: 'Active' });
    const inactive = await Department.countDocuments({ status: 'Inactive' });
    
    const stats = await Department.aggregate([
      {
        $group: {
          _id: null,
          totalDepartments: { $sum: 1 },
          totalFaculty: { $sum: '$facultyCount' },
          totalStudents: { $sum: '$studentCount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overall: stats[0] || {
          totalDepartments: 0,
          totalFaculty: 0,
          totalStudents: 0
        },
        active: active,
        inactive: inactive
      }
    });
  } catch (err) {
    next(err);
  }
}