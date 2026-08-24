import { generateCampusId } from "../utils/generateCampusId.js";
import { handle } from "../utils/asyncHandler.js";

import { Campus, Department, University } from "../models/index.js";

// Resolve the single university (single-university architecture)
const getSingleUniversity = async () =>
  University.findOne({ isDeleted: { $ne: true } });

// Check if a main campus already exists (excluding a given campus id)
const findExistingMain = async (universityId, excludeId = null) => {
  const query = {
    universityId,
    isMainCampus: true,
    isDeleted: { $ne: true },
  };
  if (excludeId) query._id = { $ne: excludeId };
  return Campus.findOne(query);
};

// Build nested address object from flat or nested body fields
const buildAddress = (body) => ({
  street: body.street || body.address?.street || "",
  city: body.city || body.address?.city || "",
  province: body.province || body.address?.province || "",
  country: body.country || body.address?.country || "Pakistan",
  postalCode: body.postalCode || body.address?.postalCode || "",
});

export const createCampus = handle(async (req, res) => {
  const {
    name,
    campusCode,
    type,
    isMainCampus,
    phone,
    email,
    establishedYear,
    description,
    status,
  } = req.body;

  // Validate required fields
  if (!name || !campusCode) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: name and campusCode are required",
    });
  }

  // Auto-resolve the single university
  const university = await getSingleUniversity();
  if (!university) {
    return res.status(404).json({
      success: false,
      message: "No university exists. Create the university first.",
    });
  }

  // Duplicate check (code or name within this university)
  const existingCampus = await Campus.findOne({
    universityId: university._id,
    isDeleted: { $ne: true },
    $or: [
      { campusCode: campusCode.toUpperCase() },
      { name },
    ],
  });
  if (existingCampus) {
    return res.status(409).json({
      success: false,
      message: "Campus with this code or name already exists for this university",
    });
  }

  // First campus automatically becomes main
  const campusCount = await Campus.countDocuments({
    universityId: university._id,
    isDeleted: { $ne: true },
  });
  const isFirstCampus = campusCount === 0;

  // If requester wants main but one already exists, block it
  if (Boolean(isMainCampus) && !isFirstCampus) {
    const existingMain = await findExistingMain(university._id);
    if (existingMain) {
      return res.status(400).json({
        success: false,
        message: `A main campus already exists (${existingMain.name}). Uncheck it first before setting a new main campus.`,
      });
    }
  }

  const shouldBeMain = Boolean(isMainCampus) || isFirstCampus;

  const campus = new Campus({
    campusId: await generateCampusId(university._id),
    universityId: university._id,
    name,
    campusCode: campusCode.toUpperCase(),
    type: type || (campusCount === 0 ? "Main Campus" : "Branch"),
    isMainCampus: shouldBeMain,
    address: buildAddress(req.body),
    phone: phone || "",
    email: email || "",
    establishedYear: establishedYear || null,
    description: description || "",
    status: status || "Active",
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  await campus.save();

  res.status(201).json({
    success: true,
    message: "Campus created successfully",
    data: campus,
  });
});

export const getCampuses = handle(async (req, res) => {
  const university = await getSingleUniversity();
  if (!university) {
    return res.json({ success: true, data: [], count: 0 });
  }

  const campuses = await Campus.find({
    universityId: university._id,
    isDeleted: { $ne: true },
  })
    .populate("universityId", "universityName universityCode")
    .select("-__v")
    .sort({ isMainCampus: -1, createdAt: 1 });

  res.json({
    success: true,
    data: campuses,
    count: campuses.length,
  });
});

export const getCampusById = handle(async (req, res) => {
  const campus = await Campus.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  }).populate("universityId", "universityName universityCode");

  if (!campus) {
    return res.status(404).json({
      success: false,
      message: "Campus not found",
    });
  }

  res.json({
    success: true,
    data: campus,
  });
});

export const updateCampus = handle(async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  // Build update object from allowed flat fields
  const updates = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.campusCode !== undefined) updates.campusCode = body.campusCode.toUpperCase();
  if (body.type !== undefined) updates.type = body.type;
  if (body.isMainCampus !== undefined) updates.isMainCampus = body.isMainCampus;
  if (body.phone !== undefined) updates.phone = body.phone;
  if (body.email !== undefined) updates.email = body.email;
  if (body.establishedYear !== undefined) updates.establishedYear = body.establishedYear || null;
  if (body.description !== undefined) updates.description = body.description;
  if (body.status !== undefined) updates.status = body.status;

  // Block setting isMainCampus=true if another campus is already main
  if (updates.isMainCampus === true) {
    const currentCampus = await Campus.findOne({ _id: id, isDeleted: { $ne: true } }).select("universityId isMainCampus");
    if (currentCampus && !currentCampus.isMainCampus) {
      const existingMain = await findExistingMain(currentCampus.universityId, id);
      if (existingMain) {
        return res.status(400).json({
          success: false,
          message: `A main campus already exists (${existingMain.name}). Uncheck it first before setting a new main campus.`,
        });
      }
    }
  }

  // Address: rebuild from flat fields when any address-related field present
  if (
    body.street !== undefined || body.city !== undefined ||
    body.province !== undefined || body.country !== undefined ||
    body.postalCode !== undefined || typeof body.address === "object"
  ) {
    const current = await Campus.findOne({ _id: id, isDeleted: { $ne: true } }).select("address");
    if (!current) {
      return res.status(404).json({ success: false, message: "Campus not found" });
    }
    updates.address = {
      ...buildAddress(body),
      // Preserve existing values for fields not sent
      ...(updates.address || {}),
    };
    // Fill gaps from current record
    updates.address.street = updates.address.street || current.address?.street || "";
    updates.address.city = updates.address.city || current.address?.city || "";
    updates.address.province = updates.address.province || current.address?.province || "";
    updates.address.country = updates.address.country && updates.address.country !== "Pakistan"
      ? updates.address.country : (body.country || current.address?.country || "Pakistan");
    updates.address.postalCode = updates.address.postalCode || current.address?.postalCode || "";
  }

  // Never allow changing tenant/id/audit fields directly
  delete updates.universityId;
  delete updates.campusId;
  delete updates.createdBy;
  delete updates.isDeleted;
  delete updates.deletedAt;
  delete updates.deletedBy;

  updates.updatedBy = req.user._id;

  const campus = await Campus.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    { $set: updates },
    { new: true, runValidators: true }
  ).populate("universityId", "universityName universityCode");

  if (!campus) {
    return res.status(404).json({
      success: false,
      message: "Campus not found",
    });
  }

  res.json({
    success: true,
    message: "Campus updated successfully",
    data: campus,
  });
});

export const deleteCampus = handle(async (req, res) => {
  const { id } = req.params;

  const campus = await Campus.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!campus) {
    return res.status(404).json({
      success: false,
      message: "Campus not found",
    });
  }

  // Prevent deleting main campus if other campuses exist
  if (campus.isMainCampus) {
    const otherCampuses = await Campus.countDocuments({
      universityId: campus.universityId,
      isDeleted: { $ne: true },
      _id: { $ne: id },
    });
    if (otherCampuses > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete main campus. Set another campus as main first.",
      });
    }
  }

  // Cascade soft-delete to departments scoped to this campus
  const now = new Date();
  const deletedBy = req.user?._id || null;

  await Department.updateMany(
    { campusId: campus._id, isDeleted: { $ne: true } },
    { $set: { isDeleted: true, deletedAt: now, deletedBy } }
  );

  await campus.updateOne({
    isDeleted: true,
    deletedAt: now,
    deletedBy,
  });

  res.json({
    success: true,
    message: "Campus and its departments deleted successfully",
  });
});
