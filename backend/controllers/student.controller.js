import Student from '../models/academic/Student.js';

// GET /api/students
export async function getStudents(req, res, next) {
  try {
    // Support query parameters for filtering
    const { program, department, status, search, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = {};
    if (program) filter.program = program;
    if (department) filter.department = department;
    if (status) filter.status = status;
    
    // Text search on name and email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get students with pagination
    const students = await Student.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .select('-__v');

    const totalCount = await Student.countDocuments(filter);

    res.json({
      success: true,
      count: students.length,
      total: totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      data: students
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/students/:id
export async function getStudentById(req, res, next) {
  try {
    const student = await Student.findById(req.params.id).select('-__v');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student ${req.params.id} not found`
      });
    }
    
    res.json({ success: true, data: student });
  } catch (err) {
    // Handle invalid ObjectId format
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format'
      });
    }
    next(err);
  }
}

// POST /api/students
export async function createStudent(req, res, next) {
  try {
    const { name, program, department, email, cnic } = req.body;
    
    // Validate required fields
    if (!name || !program || !department) {
      return res.status(400).json({
        success: false,
        message: "name, program and department are required fields",
      });
    }

    // Check for duplicate email
    if (email) {
      const existingEmail = await Student.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: `Student with email ${email} already exists`
        });
      }
    }

    // Check for duplicate CNIC
    if (cnic) {
      const existingCnic = await Student.findOne({ cnic });
      if (existingCnic) {
        return res.status(400).json({
          success: false,
          message: `Student with CNIC ${cnic} already exists`
        });
      }
    }

    // Create new student with defaults
    const studentData = {
      name,
      program,
      department,
      semester: req.body.semester ?? 1,
      gpa: req.body.gpa ?? 0,
      cgpa: req.body.cgpa ?? 0,
      attendance: req.body.attendance ?? 0,
      fee: req.body.fee ?? "Pending",
      city: req.body.city ?? "",
      campus: req.body.campus ?? "",
      status: req.body.status ?? "Active",
      email: email ?? "",
      phone: req.body.phone ?? "",
      fatherName: req.body.fatherName ?? "",
      motherName: req.body.motherName ?? "",
      cnic: cnic ?? "",
    };

    const student = new Student(studentData);
    await student.save();

    res.status(201).json({
      success: true,
      data: student
    });
  } catch (err) {
    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate ${field}. Please use a unique value.`
      });
    }
    
    // Handle validation errors
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

// PUT /api/students/:id
export async function updateStudent(req, res, next) {
  try {
    const { id } = req.params;
    
    // Check if student exists
    const existingStudent = await Student.findById(id);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: `Student ${id} not found`
      });
    }

    // Check for duplicate email (if updating)
    if (req.body.email) {
      const duplicateEmail = await Student.findOne({
        email: req.body.email,
        _id: { $ne: id }
      });
      if (duplicateEmail) {
        return res.status(400).json({
          success: false,
          message: `Student with email ${req.body.email} already exists`
        });
      }
    }

    // Check for duplicate CNIC (if updating)
    if (req.body.cnic) {
      const duplicateCnic = await Student.findOne({
        cnic: req.body.cnic,
        _id: { $ne: id }
      });
      if (duplicateCnic) {
        return res.status(400).json({
          success: false,
          message: `Student with CNIC ${req.body.cnic} already exists`
        });
      }
    }

    // Update student - remove id from body if present
    const { id: _, ...updateData } = req.body;
    
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true, // Return updated document
        runValidators: true // Run validation on update
      }
    ).select('-__v');

    res.json({
      success: true,
      data: updatedStudent
    });
  } catch (err) {
    // Handle invalid ObjectId format
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format'
      });
    }
    
    // Handle validation errors
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

// DELETE /api/students/:id
export async function deleteStudent(req, res, next) {
  try {
    const { id } = req.params;
    
    const student = await Student.findByIdAndDelete(id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student ${id} not found`
      });
    }

    res.json({
      success: true,
      message: "Student deleted successfully",
      data: student
    });
  } catch (err) {
    // Handle invalid ObjectId format
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format'
      });
    }
    next(err);
  }
}

// BULK CREATE /api/students/bulk
export async function bulkCreateStudents(req, res, next) {
  try {
    const students = req.body.students || req.body;
    
    if (!Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of students'
      });
    }

    if (students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student array cannot be empty'
      });
    }

    // Validate each student has required fields
    const invalidStudents = students.filter(s => !s.name || !s.program || !s.department);
    if (invalidStudents.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Each student must have name, program and department',
        invalidCount: invalidStudents.length
      });
    }

    // Insert all students
    const createdStudents = await Student.insertMany(students);
    
    res.status(201).json({
      success: true,
      count: createdStudents.length,
      data: createdStudents
    });
  } catch (err) {
    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate key error. Check for duplicate emails or CNIC',
        error: err.message
      });
    }
    next(err);
  }
}

// GET /api/students/stats
export async function getStudentStats(req, res, next) {
  try {
    // Get overall statistics
    const stats = await Student.aggregate([
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          averageGPA: { $avg: '$gpa' },
          averageAttendance: { $avg: '$attendance' },
          paidFee: {
            $sum: { $cond: [{ $eq: ['$fee', 'Paid'] }, 1, 0] }
          },
          pendingFee: {
            $sum: { $cond: [{ $eq: ['$fee', 'Pending'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get statistics by program
    const programStats = await Student.aggregate([
      {
        $group: {
          _id: '$program',
          count: { $sum: 1 },
          avgGPA: { $avg: '$gpa' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get statistics by status
    const statusStats = await Student.aggregate([
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
          totalStudents: 0,
          averageGPA: 0,
          averageAttendance: 0,
          paidFee: 0,
          pendingFee: 0
        },
        byProgram: programStats,
        byStatus: statusStats
      }
    });
  } catch (err) {
    next(err);
  }
}