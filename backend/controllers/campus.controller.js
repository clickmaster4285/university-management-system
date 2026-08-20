import Campus from "../models/core/Campus.js";
import University from "../models/core/University.js";
import { generateCampusId } from "../utils/generateCampusId.js";

export const createCampus = async (req, res) => {
  try {

    const {
      universityId,
      name,
      campusCode,
      type,
      isMainCampus,
      street,
      city,
      province,
      country,
      postalCode,
      phone,
      email,
      establishedYear,
      description,
      status,
    } = req.body;

    // Validate required fields
    if (!universityId || !name || !campusCode || !city || !province) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: universityId, name, campusCode, city, province are required"
      });
    }

    // Check if university exists
    const university = await University.findOne({ _id: universityId, isDeleted: { $ne: true } });
    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }

    // Check if campus already exists for this university
    const existingCampus = await Campus.findOne({
      universityId,
      isDeleted: { $ne: true },
      $or: [
        { campusCode: campusCode.toUpperCase() },
        { name: name }
      ]
    });

    if (existingCampus) {
      return res.status(400).json({
        success: false,
        message: "Campus with this code or name already exists for this university"
      });
    }

    // If this is the first campus, make it main campus
    const campusCount = await Campus.countDocuments({ universityId, isDeleted: { $ne: true } });
    const shouldBeMain = isMainCampus || campusCount === 0;

    const campus = new Campus({
      campusId: await generateCampusId(universityId),
      universityId,
      name,
      campusCode: campusCode.toUpperCase(),
      type: type || (campusCount === 0 ? 'Main Campus' : 'Branch'),
      isMainCampus: shouldBeMain,
      address: {
        street: street || "",
        city: city,
        province: province,
        country: country || "Pakistan",
        postalCode: postalCode || "",
      },
      phone: phone || "",
      email: email || "",
      establishedYear: establishedYear || null,
      description: description || "",
      status: status || "Active",
    });

    await campus.save();

    res.status(201).json({
      success: true,
      message: "Campus created successfully",
      data: campus,
    });
  } catch (error) {
    console.error("❌ Create Campus Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create campus",
      error: error.message,
    });
  }
};

export const getCampuses = async (req, res) => {
  try {
    const { universityId } = req.query;
    
    
    if (!universityId) {
      return res.status(400).json({
        success: false,
        message: "universityId is required"
      });
    }
    
    const campuses = await Campus.find({ universityId, isDeleted: { $ne: true } })
      .populate('universityId', 'universityName universityCode')
      .select("-__v")
      .sort({ isMainCampus: -1, createdAt: 1 });
    
    
    res.json({
      success: true,
      data: campuses,
      count: campuses.length,
    });
  } catch (error) {
    console.error("❌ Get Campuses Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch campuses",
      error: error.message,
    });
  }
};

export const getCampusById = async (req, res) => {
  try {
    const campus = await Campus.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate('universityId', 'universityName universityCode');
    
    if (!campus) {
      return res.status(404).json({
        success: false,
        message: "Campus not found"
      });
    }
    
    res.json({
      success: true,
      data: campus,
    });
  } catch (error) {
    console.error("❌ Get Campus Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch campus",
      error: error.message,
    });
  }
};

export const updateCampus = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove fields that shouldn't be updated
    delete updates._id;
    delete updates.campusId;
    delete updates.createdAt;
    delete updates.universityId;
    delete updates.isMainCampus;
    
    if (updates.campusCode) {
      updates.campusCode = updates.campusCode.toUpperCase();
    }
    
    const campus = await Campus.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      updates,
      { new: true, runValidators: true }
    ).populate('universityId', 'universityName universityCode');
    
    if (!campus) {
      return res.status(404).json({
        success: false,
        message: "Campus not found"
      });
    }
    
    res.json({
      success: true,
      message: "Campus updated successfully",
      data: campus,
    });
  } catch (error) {
    console.error("❌ Update Campus Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update campus",
      error: error.message,
    });
  }
};

export const deleteCampus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const campus = await Campus.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!campus) {
      return res.status(404).json({
        success: false,
        message: "Campus not found"
      });
    }
    
    // Prevent deleting main campus if there are other campuses
    if (campus.isMainCampus) {
      const otherCampuses = await Campus.countDocuments({ 
        universityId: campus.universityId,
        isDeleted: { $ne: true },
        _id: { $ne: id }
      });
      
      if (otherCampuses > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete main campus. Please set another campus as main first."
        });
      }
    }
    
    // Soft delete the campus
    await campus.updateOne({
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.user?._id || null,
    });
    
    res.json({
      success: true,
      message: "Campus deleted successfully"
    });
  } catch (error) {
    console.error("❌ Delete Campus Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete campus",
      error: error.message,
    });
  }
};

export const setMainCampus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const campus = await Campus.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!campus) {
      return res.status(404).json({
        success: false,
        message: "Campus not found"
      });
    }
    
    // Remove main status from all campuses in this university
    await Campus.updateMany(
      { universityId: campus.universityId, isDeleted: { $ne: true } },
      { isMainCampus: false }
    );
    
    // Set this campus as main
    campus.isMainCampus = true;
    await campus.save();
    
    res.json({
      success: true,
      message: "Main campus updated successfully",
      data: campus,
    });
  } catch (error) {
    console.error("❌ Set Main Campus Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set main campus",
      error: error.message,
    });
  }
};