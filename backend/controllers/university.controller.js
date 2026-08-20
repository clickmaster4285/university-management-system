import University from "../models/core/University.js";
import User from "../models/core/User.js";
import Campus from "../models/core/Campus.js";
import { generateUniversityId } from "../utils/generateUniversityId.js";

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    console.error(`❌ ${fn.name} Error:`, error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate value. A record with this value already exists.",
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// 1. CREATE UNIVERSITY (public)
export const createUniversity = handle(async (req, res) => {
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
  } = req.body;

  // Validate required fields
  if (!universityName || !universityCode || !officialEmail) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: universityName, universityCode, officialEmail are required"
    });
  }

  // Check if a university already exists
  const existingUniversity = await University.findOne({ isDeleted: { $ne: true } });

  if (existingUniversity) {
    return res.status(400).json({
      success: false,
      message: "A university already exists. Only one university is supported."
    });
  }

  const university = new University({
    universityId: await generateUniversityId(),
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
    status: "Active",
  });

  await university.save();

  // Link the existing default admin to this university
  await User.updateMany(
    { role: "Admin", $or: [{ universityId: { $exists: false } }, { universityId: null }] },
    { $set: { universityId: university._id } }
  );

  res.status(201).json({
    success: true,
    message: "University created successfully",
    data: university,
  });
});

// 2. GET UNIVERSITY (single read — there is only one university)
export const getUniversity = handle(async (req, res) => {
  const university = await University.findOne({ isDeleted: { $ne: true } });

  if (!university) {
    return res.status(404).json({
      success: false,
      message: "University not found"
    });
  }

  const [campusCount, userCount, totalStudents, totalTeachers, totalStaff, totalAdmins] =
    await Promise.all([
      Campus.countDocuments({ universityId: university._id, isDeleted: { $ne: true } }),
      User.countDocuments({ universityId: university._id, isDeleted: { $ne: true } }),
      User.countDocuments({ universityId: university._id, role: "Student", isDeleted: { $ne: true } }),
      User.countDocuments({ universityId: university._id, role: "Teacher", isDeleted: { $ne: true } }),
      User.countDocuments({ universityId: university._id, role: "Staff", isDeleted: { $ne: true } }),
      User.countDocuments({ universityId: university._id, role: "Admin", isDeleted: { $ne: true } }),
    ]);

  const data = university.toObject();
  data.campusCount = campusCount;
  data.userCount = userCount;
  data.stats = {
    totalStudents,
    totalTeachers,
    totalStaff,
    totalAdmins,
    totalUsers: totalStudents + totalTeachers + totalStaff + totalAdmins,
    totalCampuses: campusCount,
  };

  res.json({
    success: true,
    data,
  });
});

// 3. UPDATE UNIVERSITY (single update — handles all updates)
export const updateUniversity = handle(async (req, res) => {
  const updates = req.body;

  // Remove fields that shouldn't be updated via the API
  delete updates._id;
  delete updates.universityId;
  delete updates.createdAt;
  delete updates.updatedAt;
  delete updates.isDeleted;
  delete updates.deletedAt;
  delete updates.deletedBy;

  if (updates.universityCode) {
    updates.universityCode = updates.universityCode.toUpperCase();
  }

  if (updates.shortName) {
    updates.shortName = updates.shortName.toUpperCase();
  }

  const university = await University.findOneAndUpdate(
    { isDeleted: { $ne: true } },
    updates,
    { new: true, runValidators: true }
  );

  if (!university) {
    return res.status(404).json({
      success: false,
      message: "University not found"
    });
  }

  res.json({
    success: true,
    message: "University updated successfully",
    data: university,
  });
});

// 4. DELETE UNIVERSITY (soft delete)
export const deleteUniversity = handle(async (req, res) => {
  const university = await University.findOne({ isDeleted: { $ne: true } });

  if (!university) {
    return res.status(404).json({
      success: false,
      message: "University not found"
    });
  }

  // Soft delete the university and cascade-soft-delete all university-scoped data
  const now = new Date();
  const deletedBy = req.user?._id || null;

  await university.updateOne({ isDeleted: true, deletedAt: now, deletedBy });
  await User.updateMany(
    { universityId: university._id, isDeleted: { $ne: true } },
    { $set: { isDeleted: true, deletedAt: now, deletedBy } }
  );
  await Campus.updateMany(
    { universityId: university._id, isDeleted: { $ne: true } },
    { $set: { isDeleted: true, deletedAt: now, deletedBy } }
  );

  res.json({
    success: true,
    message: "University and all associated data deleted successfully"
  });
});