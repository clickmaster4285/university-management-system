import University from "../models/University.js";
import User from "../models/User.js";
import Campus from "../models/Campus.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ========================================
// 1. CREATE UNIVERSITY
// ========================================
export const createUniversity = async (req, res) => {
  try {
    console.log("📝 Creating university with data:", req.body);

    const {
      universityName,
      universityCode,
      shortName,
      universityType,
      registrationNumber,
      officialEmail,
      phoneNumber,
      website,
      country,
      province,
      city,
      address,
      academicSystem,
      gradingSystem,
      maxGPA,
      passingGPA,
      firstName,
      lastName,
      adminEmail,
      password,
    } = req.body;

    // Validate required fields
    if (!universityName || !universityCode || !adminEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: universityName, universityCode, adminEmail, password are required"
      });
    }

    // Check if university already exists
    const existingUniversity = await University.findOne({
      $or: [
        { universityCode: universityCode.toUpperCase() },
        { officialEmail: officialEmail.toLowerCase() },
      ]
    });

    if (existingUniversity) {
      return res.status(400).json({
        success: false,
        message: "University with this code or email already exists"
      });
    }

    // Check if admin user already exists
    const existingUser = await User.findOne({ 
      email: adminEmail.toLowerCase() 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Admin email already registered"
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create university first
    const university = new University({
      universityName,
      universityCode: universityCode.toUpperCase(),
      shortName: shortName ? shortName.toUpperCase() : universityCode.toUpperCase(),
      universityType: universityType || "Private",
      registrationNumber: registrationNumber || "",
      officialEmail: officialEmail.toLowerCase(),
      phoneNumber: phoneNumber || "",
      website: website || "",
      address: {
        country: country || "Pakistan",
        province: province || "",
        city: city || "",
        street: address || "",
      },
      academicSettings: {
        academicSystem: academicSystem || "Semester",
        gradingSystem: gradingSystem || "GPA",
        maxGPA: maxGPA || 4.0,
        passingGPA: passingGPA || 2.0,
      },
      administrator: {
        firstName: firstName || "Admin",
        lastName: lastName || "User",
        email: adminEmail.toLowerCase(),
      },
      status: "Active",
    });

    await university.save();
    console.log("✅ University created:", university._id);

    // Create admin user with university reference
    // Role is "Admin" not "Super Admin" - Super Admin is a system-level role
    const adminUser = new User({
      firstName: firstName || "Admin",
      lastName: lastName || "User",
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
      universityId: university._id,
      role: "Admin",
      status: "Active",
    });

    const savedAdmin = await adminUser.save();
    console.log("✅ Admin user created:", savedAdmin._id);

    // Update university with admin user ID
    university.administrator.userId = savedAdmin._id;
    await university.save();

    // Generate JWT token for auto-login
    const token = jwt.sign(
      { 
        id: savedAdmin._id, 
        email: savedAdmin.email,
        universityId: university._id,
        role: savedAdmin.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Prepare user data for response
    const userData = {
      id: savedAdmin._id,
      firstName: savedAdmin.firstName,
      lastName: savedAdmin.lastName,
      email: savedAdmin.email,
      role: savedAdmin.role,
      universityId: university._id,
      universityName: university.universityName,
      universityCode: university.universityCode,
    };

    res.status(201).json({
      success: true,
      message: "University created successfully",
      university: {
        id: university._id,
        universityId: university.universityId,
        universityName: university.universityName,
        universityCode: university.universityCode,
        admin: {
          id: savedAdmin._id,
          firstName: savedAdmin.firstName,
          lastName: savedAdmin.lastName,
          email: savedAdmin.email,
          role: savedAdmin.role,
        }
      },
      user: userData,
      token: token
    });
  } catch (error) {
    console.error("❌ Create University Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create university",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ========================================
// 2. GET ALL UNIVERSITIES (Super Admin only)
// ========================================
export const getUniversities = async (req, res) => {
  try {
    // Check if user is Super Admin
    if (req.user?.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super Admin privileges required."
      });
    }

    const universities = await University.find()
      .select("-__v")
      .populate("administrator.userId", "firstName lastName email role")
      .sort({ createdAt: -1 });

    // Get counts for each university
    const universitiesWithCounts = await Promise.all(
      universities.map(async (uni) => {
        const campusCount = await Campus.countDocuments({ universityId: uni._id });
        const userCount = await User.countDocuments({ universityId: uni._id });
        return {
          ...uni.toObject(),
          campusCount,
          userCount,
        };
      })
    );

    res.json({
      success: true,
      data: universitiesWithCounts,
      count: universitiesWithCounts.length,
    });
  } catch (error) {
    console.error("❌ Get Universities Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch universities",
      error: error.message,
    });
  }
};

// ========================================
// 3. GET UNIVERSITY BY ID (with access control)
// ========================================
export const getUniversityById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check access: Super Admin can access any, Admin only their own
    if (req.user?.role !== 'Super Admin' && req.user?.universityId?.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only access your own university."
      });
    }

    const university = await University.findById(id)
      .populate("administrator.userId", "firstName lastName email role");
    
    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }

    // Get counts
    const campusCount = await Campus.countDocuments({ universityId: university._id });
    const userCount = await User.countDocuments({ universityId: university._id });

    const universityData = university.toObject();
    universityData.campusCount = campusCount;
    universityData.userCount = userCount;

    res.json({
      success: true,
      data: universityData
    });
  } catch (error) {
    console.error("❌ Get University Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch university",
      error: error.message,
    });
  }
};

// ========================================
// 4. GET UNIVERSITY BY CODE
// ========================================
export const getUniversityByCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    const university = await University.findOne({ 
      universityCode: code.toUpperCase() 
    }).populate("administrator.userId", "firstName lastName email role");
    
    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }

    // Check access: Super Admin can access any, Admin only their own
    if (req.user?.role !== 'Super Admin' && req.user?.universityId?.toString() !== university._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only access your own university."
      });
    }

    res.json({
      success: true,
      data: university
    });
  } catch (error) {
    console.error("❌ Get University By Code Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch university",
      error: error.message,
    });
  }
};

// ========================================
// 5. UPDATE UNIVERSITY
// ========================================
export const updateUniversity = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Check access: Super Admin can update any, Admin only their own
    if (req.user?.role !== 'Super Admin' && req.user?.universityId?.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only update your own university."
      });
    }
    
    // Remove fields that shouldn't be updated
    delete updates.universityId;
    delete updates._id;
    delete updates.createdAt;
    delete updates.administrator;
    
    if (updates.universityCode) {
      updates.universityCode = updates.universityCode.toUpperCase();
    }
    
    if (updates.shortName) {
      updates.shortName = updates.shortName.toUpperCase();
    }
    
    const university = await University.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate("administrator.userId", "firstName lastName email role");
    
    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }
    
    res.json({
      success: true,
      message: "University updated successfully",
      data: university
    });
  } catch (error) {
    console.error("❌ Update University Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update university",
      error: error.message,
    });
  }
};

// ========================================
// 6. DELETE UNIVERSITY (Super Admin only)
// ========================================
export const deleteUniversity = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Only Super Admin can delete universities
    if (req.user?.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Super Admin can delete universities."
      });
    }
    
    const university = await University.findById(id);
    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }
    
    // Delete all associated data
    await university.deleteOne();
    await User.deleteMany({ universityId: id });
    await Campus.deleteMany({ universityId: id });
    
    res.json({
      success: true,
      message: "University and all associated data deleted successfully"
    });
  } catch (error) {
    console.error("❌ Delete University Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete university",
      error: error.message,
    });
  }
};

// ========================================
// 7. GET UNIVERSITY STATISTICS
// ========================================
export const getUniversityStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check access: Super Admin can access any, Admin only their own
    if (req.user?.role !== 'Super Admin' && req.user?.universityId?.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only access your own university statistics."
      });
    }
    
    const university = await University.findById(id);
    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }
    
    const [
      totalStudents,
      totalTeachers,
      totalStaff,
      totalAdmins,
      totalCampuses,
      totalDepartments,
      totalPrograms,
      totalCourses
    ] = await Promise.all([
      User.countDocuments({ universityId: id, role: "Student" }),
      User.countDocuments({ universityId: id, role: "Teacher" }),
      User.countDocuments({ universityId: id, role: "Staff" }),
      User.countDocuments({ universityId: id, role: "Admin" }),
      Campus.countDocuments({ universityId: id }),
      // Department.countDocuments({ universityId: id }), // Add when Department model exists
      // Program.countDocuments({ universityId: id }), // Add when Program model exists
      // Course.countDocuments({ universityId: id }), // Add when Course model exists
    ]);
    
    res.json({
      success: true,
      data: {
        universityName: university.universityName,
        universityId: university.universityId,
        totalStudents,
        totalTeachers,
        totalStaff,
        totalAdmins,
        totalUsers: totalStudents + totalTeachers + totalStaff + totalAdmins,
        totalCampuses,
        // totalDepartments,
        // totalPrograms,
        // totalCourses,
      }
    });
  } catch (error) {
    console.error("❌ Get University Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch university statistics",
      error: error.message,
    });
  }
};

// ========================================
// 8. CHECK UNIVERSITY CODE AVAILABILITY
// ========================================
export const checkUniversityCode = async (req, res) => {
  try {
    const { code } = req.params;
    const university = await University.findOne({ 
      universityCode: code.toUpperCase() 
    });
    res.json({
      success: true,
      exists: !!university,
      message: university ? "Code already taken" : "Code available"
    });
  } catch (error) {
    console.error("❌ Check University Code Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check university code",
      error: error.message,
    });
  }
};

// ========================================
// 9. GET UNIVERSITY CAMPUSES (Admin only)
// ========================================
export const getUniversityCampuses = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check access: Super Admin can access any, Admin only their own
    if (req.user?.role !== 'Super Admin' && req.user?.universityId?.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only access your own university campuses."
      });
    }
    
    const university = await University.findById(id);
    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }
    
    const campuses = await Campus.find({ universityId: id })
      .sort({ isMainCampus: -1, createdAt: 1 });
    
    res.json({
      success: true,
      data: campuses,
      count: campuses.length
    });
  } catch (error) {
    console.error("❌ Get University Campuses Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch university campuses",
      error: error.message,
    });
  }
};

// ========================================
// 10. GET UNIVERSITY USERS (Admin only)
// ========================================
export const getUniversityUsers = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check access: Super Admin can access any, Admin only their own
    if (req.user?.role !== 'Super Admin' && req.user?.universityId?.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only access your own university users."
      });
    }
    
    const university = await University.findById(id);
    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }
    
    const users = await User.find({ universityId: id })
      .select("-password")
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error("❌ Get University Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch university users",
      error: error.message,
    });
  }
};

// ========================================
// 11. UPDATE UNIVERSITY STATUS (Super Admin only)
// ========================================
export const updateUniversityStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Only Super Admin can update university status
    if (req.user?.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Super Admin can update university status."
      });
    }
    
    if (!status || !['Active', 'Inactive', 'Suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be Active, Inactive, or Suspended."
      });
    }
    
    const university = await University.findByIdAndUpdate(
      id,
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate("administrator.userId", "firstName lastName email role");
    
    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }
    
    res.json({
      success: true,
      message: `University status updated to ${status}`,
      data: university
    });
  } catch (error) {
    console.error("❌ Update University Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update university status",
      error: error.message,
    });
  }
};