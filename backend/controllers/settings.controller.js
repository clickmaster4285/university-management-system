// backend/src/controllers/settings.controller.js
import Settings from '../models/Settings.js';

// Get settings
export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
};

// Update university profile
export const updateProfile = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const { universityName, shortCode, contactEmail, phone, currency, language, address, website } = req.body;

    settings.universityName = universityName || settings.universityName;
    settings.shortCode = shortCode || settings.shortCode;
    settings.contactEmail = contactEmail || settings.contactEmail;
    settings.phone = phone || settings.phone;
    settings.currency = currency || settings.currency;
    settings.language = language || settings.language;
    settings.address = address || settings.address;
    settings.website = website || settings.website;
    settings.lastUpdatedBy = req.user?.id || null;
    settings.updatedAt = new Date();

    await settings.save();


    res.status(200).json({
      success: true,
      data: settings,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Update preferences
export const updatePreferences = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const { darkMode, emailDigests, publicPortal, aiInsights, faceRecognitionAttendance } = req.body;

    settings.preferences = {
      darkMode: darkMode !== undefined ? darkMode : settings.preferences.darkMode,
      emailDigests: emailDigests !== undefined ? emailDigests : settings.preferences.emailDigests,
      publicPortal: publicPortal !== undefined ? publicPortal : settings.preferences.publicPortal,
      aiInsights: aiInsights !== undefined ? aiInsights : settings.preferences.aiInsights,
      faceRecognitionAttendance: faceRecognitionAttendance !== undefined ? faceRecognitionAttendance : settings.preferences.faceRecognitionAttendance
    };

    settings.lastUpdatedBy = req.user?.id || null;
    settings.updatedAt = new Date();

    await settings.save();

    res.status(200).json({
      success: true,
      data: settings,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message
    });
  }
};

// ✅ FIXED: Add campus with proper debugging
export const addCampus = async (req, res) => {
  try {
    
    const settings = await Settings.getSettings();
    const { name, location, students, staff } = req.body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Campus name is required'
      });
    }

    // Check for duplicate campus name
    const duplicateCampus = settings.campuses.find(
      c => c.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    if (duplicateCampus) {
      return res.status(409).json({
        success: false,
        message: `Campus "${name}" already exists. Please use a different name.`
      });
    }

    // Create new campus
    const newCampus = {
      name: name.trim(),
      location: location?.trim() || '',
      students: Number(students) || 0,
      staff: Number(staff) || 0,
      isActive: true,
      createdAt: new Date()
    };

    // ✅ Push to campuses array
    settings.campuses.push(newCampus);
    settings.lastUpdatedBy = req.user?.id || null;
    settings.updatedAt = new Date();

    // ✅ Save the settings document
    await settings.save();


    res.status(201).json({
      success: true,
      data: settings,
      message: `Campus "${name}" added successfully`
    });
  } catch (error) {
    console.error('❌ Error adding campus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add campus',
      error: error.message,
      hint: 'Make sure MongoDB is running and reachable before saving settings.'
    });
  }
};

// ✅ FIXED: Update campus
export const updateCampus = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const { campusId } = req.params;
    const { name, location, students, staff, isActive } = req.body;

    // Find campus by _id
    const campusIndex = settings.campuses.findIndex(c => c._id.toString() === campusId);
    if (campusIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Campus not found'
      });
    }

    // Check for duplicate name (excluding the current campus)
    if (name && name.trim() !== '') {
      const duplicateCampus = settings.campuses.find(
        c => c.name.toLowerCase() === name.trim().toLowerCase() && 
             c._id.toString() !== campusId
      );
      if (duplicateCampus) {
        return res.status(409).json({
          success: false,
          message: `Campus "${name}" already exists. Please use a different name.`
        });
      }
      settings.campuses[campusIndex].name = name.trim();
    }

    // Update fields if provided
    if (location !== undefined) settings.campuses[campusIndex].location = location?.trim() || '';
    if (students !== undefined) settings.campuses[campusIndex].students = Number(students) || 0;
    if (staff !== undefined) settings.campuses[campusIndex].staff = Number(staff) || 0;
    if (isActive !== undefined) settings.campuses[campusIndex].isActive = isActive;

    settings.lastUpdatedBy = req.user?.id || null;
    settings.updatedAt = new Date();

    await settings.save();


    res.status(200).json({
      success: true,
      data: settings,
      message: `Campus updated successfully`
    });
  } catch (error) {
    console.error('Error updating campus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update campus',
      error: error.message
    });
  }
};

// Delete campus
export const deleteCampus = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const { campusId } = req.params;

    const campusIndex = settings.campuses.findIndex(c => c._id.toString() === campusId);
    if (campusIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Campus not found'
      });
    }

    const campusName = settings.campuses[campusIndex].name;
    settings.campuses.splice(campusIndex, 1);
    settings.lastUpdatedBy = req.user?.id || null;
    settings.updatedAt = new Date();

    await settings.save();


    res.status(200).json({
      success: true,
      data: settings,
      message: `Campus "${campusName}" deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting campus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete campus',
      error: error.message
    });
  }
};

// Get single campus by ID
export const getCampusById = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const { campusId } = req.params;

    const campus = settings.campuses.find(c => c._id.toString() === campusId);
    if (!campus) {
      return res.status(404).json({
        success: false,
        message: 'Campus not found'
      });
    }

    res.status(200).json({
      success: true,
      data: campus
    });
  } catch (error) {
    console.error('Error fetching campus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campus',
      error: error.message
    });
  }
};

// Toggle campus active status
export const toggleCampusStatus = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const { campusId } = req.params;

    const campusIndex = settings.campuses.findIndex(c => c._id.toString() === campusId);
    if (campusIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Campus not found'
      });
    }

    settings.campuses[campusIndex].isActive = !settings.campuses[campusIndex].isActive;
    settings.lastUpdatedBy = req.user?.id || null;
    settings.updatedAt = new Date();

    await settings.save();

    const status = settings.campuses[campusIndex].isActive ? 'activated' : 'deactivated';

    res.status(200).json({
      success: true,
      data: settings,
      message: `Campus ${status} successfully`
    });
  } catch (error) {
    console.error('Error toggling campus status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle campus status',
      error: error.message
    });
  }
};

// Update branding
export const updateBranding = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const { primaryColor, secondaryColor, accentColor, fontFamily } = req.body;

    settings.branding = {
      primaryColor: primaryColor || settings.branding.primaryColor,
      secondaryColor: secondaryColor || settings.branding.secondaryColor,
      accentColor: accentColor || settings.branding.accentColor,
      fontFamily: fontFamily || settings.branding.fontFamily
    };

    settings.lastUpdatedBy = req.user?.id || null;
    settings.updatedAt = new Date();

    await settings.save();

    res.status(200).json({
      success: true,
      data: settings,
      message: 'Branding updated successfully'
    });
  } catch (error) {
    console.error('Error updating branding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update branding',
      error: error.message
    });
  }
};

// Update integrations
export const updateIntegration = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const { type, config } = req.body;

    if (!settings.integrations[type]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid integration type'
      });
    }

    settings.integrations[type] = {
      ...settings.integrations[type],
      ...config
    };

    settings.lastUpdatedBy = req.user?.id || null;
    settings.updatedAt = new Date();

    await settings.save();

    res.status(200).json({
      success: true,
      data: settings,
      message: 'Integration updated successfully'
    });
  } catch (error) {
    console.error('Error updating integration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update integration',
      error: error.message
    });
  }
};

// Update security settings
export const updateSecurity = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const { sessionTimeout, maxLoginAttempts, twoFactorAuth, passwordPolicy } = req.body;

    if (sessionTimeout) settings.security.sessionTimeout = sessionTimeout;
    if (maxLoginAttempts) settings.security.maxLoginAttempts = maxLoginAttempts;
    if (twoFactorAuth !== undefined) settings.security.twoFactorAuth = twoFactorAuth;
    if (passwordPolicy) {
      settings.security.passwordPolicy = {
        ...settings.security.passwordPolicy,
        ...passwordPolicy
      };
    }

    settings.lastUpdatedBy = req.user?.id || null;
    settings.updatedAt = new Date();

    await settings.save();

    res.status(200).json({
      success: true,
      data: settings,
      message: 'Security settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating security:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update security settings',
      error: error.message
    });
  }
};

// Update maintenance mode
export const updateMaintenance = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const { isEnabled, message, scheduledAt } = req.body;

    settings.maintenance = {
      isEnabled: isEnabled !== undefined ? isEnabled : settings.maintenance.isEnabled,
      message: message || settings.maintenance.message,
      scheduledAt: scheduledAt || settings.maintenance.scheduledAt
    };

    settings.lastUpdatedBy = req.user?.id || null;
    settings.updatedAt = new Date();

    await settings.save();

    res.status(200).json({
      success: true,
      data: settings,
      message: 'Maintenance settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating maintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update maintenance settings',
      error: error.message
    });
  }
};

// Reset settings to default
export const resetSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const defaultSettings = new Settings();
    
    // Keep the _id but reset all fields
    Object.keys(defaultSettings.toObject()).forEach(key => {
      if (key !== '_id' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt') {
        settings[key] = defaultSettings[key];
      }
    });

    settings.lastUpdatedBy = req.user?.id || null;
    settings.updatedAt = new Date();

    await settings.save();

    res.status(200).json({
      success: true,
      data: settings,
      message: 'Settings reset to default successfully'
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset settings',
      error: error.message
    });
  }
};