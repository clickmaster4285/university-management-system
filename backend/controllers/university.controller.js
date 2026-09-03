import { generateUniversityId } from "../utils/generateUniversityId.js";
import { handle } from "../utils/asyncHandler.js";

// 1. CREATE UNIVERSITY (public)
import { Campus, University, User, Faculty, Department, Program } from "../models/index.js";
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
    createdBy: req.user._id,
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

  const universityId = university._id;
  const notDeleted = { isDeleted: { $ne: true } };

  const [
    campusCount, userCount,
    totalStudents, totalTeachers, totalStaff, totalAdmins,
    totalFaculties, totalDepartments, totalPrograms,
  ] =
    await Promise.all([
      Campus.countDocuments({ universityId, ...notDeleted }),
      User.countDocuments({ universityId, ...notDeleted }),
      User.countDocuments({ universityId, role: "Student", ...notDeleted }),
      User.countDocuments({ universityId, role: "Teacher", ...notDeleted }),
      User.countDocuments({ universityId, role: "Staff", ...notDeleted }),
      User.countDocuments({ universityId, role: "Admin", ...notDeleted }),
      Faculty.countDocuments({ ...notDeleted }),
      Department.countDocuments({ ...notDeleted }),
      Program.countDocuments({ ...notDeleted }),
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
    totalFaculties,
    totalDepartments,
    totalPrograms,
  };

  res.json({
    success: true,
    data,
  });
});

// 3. UPDATE UNIVERSITY (single update — handles all updates)
export const updateUniversity = handle(async (req, res) => {
  const body = req.body;

  // Build nested update object from flat or nested fields
  const updates = {};

  // Top-level string fields
  const stringFields = [
    "universityName", "universityCode", "shortName", "universityType",
    "registrationNumber", "officialEmail", "phoneNumber", "website", "status",
  ];
  for (const field of stringFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  // Nested address
  updates.address = {
    country: body.country || body.address?.country || "",
    province: body.province || body.address?.province || "",
    city: body.city || body.address?.city || "",
    street: body.address || body.address?.street || "",
  };

  // Nested academicSettings
  updates.academicSettings = {
    academicSystem: body.academicSystem || body.academicSettings?.academicSystem || "Semester",
    gradingSystem: body.gradingSystem || body.academicSettings?.gradingSystem || "GPA",
    maxGPA: body.maxGPA ?? body.academicSettings?.maxGPA ?? 4.0,
    passingGPA: body.passingGPA ?? body.academicSettings?.passingGPA ?? 2.0,
  };

  if (updates.universityCode) {
    updates.universityCode = updates.universityCode.toUpperCase();
  }

  if (updates.shortName) {
    updates.shortName = updates.shortName.toUpperCase();
  }

  updates.updatedBy = req.user._id;

  const university = await University.findOneAndUpdate(
    { isDeleted: { $ne: true } },
    { $set: updates },
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