import { handle } from '../utils/asyncHandler.js';
import { PlatformRole, User } from '../models/index.js';
import {
  DEFAULT_MODULE_ACCESS,
  MODULE_KEYS,
  MODULE_LABELS,
  PLATFORM_ROLES,
  ROLE_DESCRIPTIONS,
  serializeModuleAccess,
} from '../utils/moduleAccessDefaults.js';
import { logPermissionAudit } from '../utils/permissionAudit.js';

const notDeleted = { $ne: true };

async function findRoleByIdentifier(identifier) {
  return PlatformRole.findOne({ name: identifier, isDeleted: notDeleted });
}

function normalizeModuleAccess(moduleAccess = {}) {
  const normalized = {};
  MODULE_KEYS.forEach((key) => {
    normalized[key] = Boolean(moduleAccess[key]);
  });
  return normalized;
}

function serializeRole(role) {
  return {
    ...role.toObject(),
    moduleAccess: serializeModuleAccess(role.moduleAccess),
  };
}

export const listPlatformRoles = handle(async (_req, res) => {
  const roles = await PlatformRole.find({ isDeleted: notDeleted }).sort({ name: 1 });
  res.json({
    success: true,
    count: roles.length,
    data: roles.map(serializeRole),
  });
});

export const getPlatformRoleById = handle(async (req, res) => {
  const role = await findRoleByIdentifier(req.params.id);
  if (!role) {
    return res.status(404).json({ success: false, message: 'Platform role not found' });
  }
  res.json({ success: true, data: serializeRole(role) });
});

export const createPlatformRole = handle(async (req, res) => {
  const { name, description = '', moduleAccess = {} } = req.body;
  const trimmedName = String(name || '').trim();

  if (!trimmedName) {
    return res.status(400).json({ success: false, message: 'Role name is required' });
  }

  const existing = await PlatformRole.findOne({
    name: trimmedName,
    isDeleted: notDeleted,
  });
  if (existing) {
    return res.status(409).json({ success: false, message: `Role "${trimmedName}" already exists` });
  }

  const role = await PlatformRole.create({
    name: trimmedName,
    description: String(description || '').trim(),
    moduleAccess: normalizeModuleAccess(moduleAccess),
    isSystem: false,
  });

  await logPermissionAudit({
    action: 'role_created',
    targetType: 'role',
    targetId: role._id,
    targetLabel: role.name,
    actor: req.user,
    summary: `Created role "${role.name}"`,
    changes: { moduleAccess: serializeModuleAccess(role.moduleAccess) },
  });

  res.status(201).json({
    success: true,
    data: serializeRole(role),
    message: 'Role created successfully',
  });
});

export const updatePlatformRole = handle(async (req, res) => {
  const role = await findRoleByIdentifier(req.params.id);
  if (!role) {
    return res.status(404).json({ success: false, message: 'Platform role not found' });
  }

  const { name, description, moduleAccess } = req.body;

  if (name !== undefined && name.trim() !== role.name) {
    if (role.isSystem) {
      return res.status(400).json({
        success: false,
        message: 'System role names cannot be renamed',
      });
    }
    const trimmedName = String(name).trim();
    const duplicate = await PlatformRole.findOne({
      name: trimmedName,
      _id: { $ne: role._id },
      isDeleted: notDeleted,
    });
    if (duplicate) {
      return res.status(409).json({ success: false, message: `Role "${trimmedName}" already exists` });
    }
    const usersWithRole = await User.countDocuments({
      primaryRole: role.name,
      isDeleted: notDeleted,
    });
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot rename role while ${usersWithRole} user(s) are assigned to it`,
      });
    }
    role.name = trimmedName;
  }

  if (description !== undefined) role.description = String(description).trim();
  const previousAccess = serializeModuleAccess(role.moduleAccess);
  if (moduleAccess && typeof moduleAccess === 'object') {
    role.moduleAccess = normalizeModuleAccess(moduleAccess);
  }

  await role.save();

  await logPermissionAudit({
    action: 'role_updated',
    targetType: 'role',
    targetId: role._id,
    targetLabel: role.name,
    actor: req.user,
    summary: `Updated role "${role.name}"`,
    changes: {
      before: { moduleAccess: previousAccess },
      after: { moduleAccess: serializeModuleAccess(role.moduleAccess) },
    },
  });

  res.json({
    success: true,
    data: serializeRole(role),
    message: 'Role updated successfully',
  });
});

export const deletePlatformRole = handle(async (req, res) => {
  const role = await findRoleByIdentifier(req.params.id);
  if (!role) {
    return res.status(404).json({ success: false, message: 'Platform role not found' });
  }

  if (role.isSystem) {
    return res.status(400).json({
      success: false,
      message: 'System roles cannot be deleted. Use restore defaults to reset permissions.',
    });
  }

  const usersWithRole = await User.countDocuments({
    primaryRole: role.name,
    isDeleted: notDeleted,
  });
  if (usersWithRole > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete role while ${usersWithRole} user(s) are assigned to it`,
    });
  }

  role.isDeleted = true;
  role.deletedAt = new Date();
  role.deletedBy = req.user?._id || null;
  await role.save();

  await logPermissionAudit({
    action: 'role_deleted',
    targetType: 'role',
    targetId: role._id,
    targetLabel: role.name,
    actor: req.user,
    summary: `Deleted role "${role.name}"`,
  });

  res.json({ success: true, message: 'Role deleted successfully' });
});

export const reseedPlatformRoles = handle(async (req, res) => {
  const { mode = 'missing' } = req.body || {};
  let created = 0;
  let updated = 0;

  for (const name of PLATFORM_ROLES) {
    const defaults = {
      description: ROLE_DESCRIPTIONS[name] || '',
      moduleAccess: DEFAULT_MODULE_ACCESS[name] || {},
      isSystem: true,
    };

    const existing = await PlatformRole.findOne({ name, isDeleted: notDeleted });

    if (!existing) {
      await PlatformRole.create({ name, ...defaults });
      created += 1;
      continue;
    }

    if (mode === 'reset') {
      existing.description = defaults.description;
      existing.moduleAccess = defaults.moduleAccess;
      existing.isSystem = true;
      await existing.save();
      updated += 1;
    }
  }

  const roles = await PlatformRole.find({ isDeleted: notDeleted }).sort({ name: 1 });

  await logPermissionAudit({
    action: 'role_reseeded',
    targetType: 'role',
    targetLabel: 'system roles',
    actor: req.user,
    summary:
      mode === 'reset'
        ? `Restored ${updated} system role(s) to defaults`
        : `Seeded ${created} missing system role(s)`,
    changes: { mode, created, updated },
  });

  res.json({
    success: true,
    data: roles.map(serializeRole),
    message:
      mode === 'reset'
        ? `Restored ${updated} system role(s) to defaults`
        : `Seeded ${created} missing system role(s)`,
    created,
    updated,
  });
});

export const applyRoleToUsers = handle(async (req, res) => {
  const role = await findRoleByIdentifier(req.params.id);
  if (!role) {
    return res.status(404).json({ success: false, message: 'Platform role not found' });
  }

  const access = normalizeModuleAccess(serializeModuleAccess(role.moduleAccess));
  const result = await User.updateMany(
    { primaryRole: role.name, isDeleted: notDeleted },
    { $set: { moduleAccess: access } }
  );

  await logPermissionAudit({
    action: 'role_applied',
    targetType: 'role',
    targetId: role._id,
    targetLabel: role.name,
    actor: req.user,
    summary: `Applied role "${role.name}" to ${result.modifiedCount} user(s)`,
    changes: { moduleAccess: access, updated: result.modifiedCount },
  });

  res.json({
    success: true,
    data: { matched: result.matchedCount, updated: result.modifiedCount },
    message: `Updated permissions for ${result.modifiedCount} user(s) with role "${role.name}"`,
  });
});

export const getPlatformRoleMeta = handle(async (_req, res) => {
  res.json({
    success: true,
    data: {
      moduleKeys: MODULE_KEYS,
      moduleLabels: MODULE_LABELS,
      roleDescriptions: ROLE_DESCRIPTIONS,
      systemRoles: PLATFORM_ROLES,
    },
  });
});