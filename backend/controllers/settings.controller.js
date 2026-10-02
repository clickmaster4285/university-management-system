import { handle } from "../utils/asyncHandler.js";

import { Settings } from "../models/index.js";
export const getSettings = handle(async (req, res) => {
  const settings = await Settings.getSettings();
  res.status(200).json({
    success: true,
    data: settings
  });
});

export const updateProfile = handle(async (req, res) => {
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

  await settings.save();

  res.status(200).json({
    success: true,
    data: settings,
    message: 'Profile updated successfully'
  });
});

export const updatePreferences = handle(async (req, res) => {
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

  await settings.save();

  res.status(200).json({
    success: true,
    data: settings,
    message: 'Preferences updated successfully'
  });
});

export const updateBranding = handle(async (req, res) => {
  const settings = await Settings.getSettings();
  const { primaryColor, secondaryColor, accentColor, fontFamily } = req.body;

  settings.branding = {
    primaryColor: primaryColor || settings.branding.primaryColor,
    secondaryColor: secondaryColor || settings.branding.secondaryColor,
    accentColor: accentColor || settings.branding.accentColor,
    fontFamily: fontFamily || settings.branding.fontFamily
  };

  settings.lastUpdatedBy = req.user?.id || null;

  await settings.save();

  res.status(200).json({
    success: true,
    data: settings,
    message: 'Branding updated successfully'
  });
});

export const updateIntegration = handle(async (req, res) => {
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

  await settings.save();

  res.status(200).json({
    success: true,
    data: settings,
    message: 'Integration updated successfully'
  });
});

export const updateSecurity = handle(async (req, res) => {
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

  await settings.save();

  res.status(200).json({
    success: true,
    data: settings,
    message: 'Security settings updated successfully'
  });
});

export const updateMaintenance = handle(async (req, res) => {
  const settings = await Settings.getSettings();
  const { isEnabled, message, scheduledAt } = req.body;

  settings.maintenance = {
    isEnabled: isEnabled !== undefined ? isEnabled : settings.maintenance.isEnabled,
    message: message || settings.maintenance.message,
    scheduledAt: scheduledAt || settings.maintenance.scheduledAt
  };

  settings.lastUpdatedBy = req.user?.id || null;

  await settings.save();

  res.status(200).json({
    success: true,
    data: settings,
    message: 'Maintenance settings updated successfully'
  });
});

export const resetSettings = handle(async (req, res) => {
  const settings = await Settings.getSettings();
  const defaultSettings = new Settings();

  Object.keys(defaultSettings.toObject()).forEach(key => {
    if (key !== '_id' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt') {
      settings[key] = defaultSettings[key];
    }
  });

  settings.lastUpdatedBy = req.user?.id || null;

  await settings.save();

  res.status(200).json({
    success: true,
    data: settings,
    message: 'Settings reset to default successfully'
  });
});
