import { PlatformRole } from '../models/index.js';

export const PLATFORM_ROLE_POPULATE = { path: 'platformRole', select: 'name isSystem' };

export function getPlatformRoleName(user) {
  if (!user) return null;
  if (user.platformRole && typeof user.platformRole === 'object' && user.platformRole.name) {
    return user.platformRole.name;
  }
  return null;
}

export function getPlatformRoleId(user) {
  if (!user?.platformRole) return null;
  if (typeof user.platformRole === 'object' && user.platformRole._id) {
    return user.platformRole._id;
  }
  return user.platformRole;
}

export async function findPlatformRoleByName(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return null;
  return PlatformRole.findOne({ name: trimmed, isDeleted: { $ne: true } });
}

export async function findPlatformRoleByIdentifier(identifier) {
  const trimmed = String(identifier || '').trim();
  if (!trimmed) return null;
  const byName = await findPlatformRoleByName(trimmed);
  if (byName) return byName;
  try {
    return PlatformRole.findOne({ _id: trimmed, isDeleted: { $ne: true } });
  } catch {
    return null;
  }
}

/** One-time style sync for legacy user documents still storing primaryRole / platformRoleId */
export async function migrateUsersToPlatformRoleRef() {
  const legacyUsers = await PlatformRole.db.collection('users').find({
    $and: [
      { $or: [{ platformRole: null }, { platformRole: { $exists: false } }] },
      {
        $or: [
          { primaryRole: { $exists: true, $nin: [null, ''] } },
          { platformRoleId: { $exists: true, $ne: null } },
        ],
      },
    ],
  }).toArray();

  let migrated = 0;
  for (const doc of legacyUsers) {
    if (doc.platformRole) continue;

    let role = null;
    if (doc.platformRoleId) {
      role = await PlatformRole.findOne({ _id: doc.platformRoleId, isDeleted: { $ne: true } });
    }
    if (!role && doc.primaryRole) {
      role = await findPlatformRoleByName(doc.primaryRole);
    }
    if (!role) continue;

    await PlatformRole.db.collection('users').updateOne(
      { _id: doc._id },
      {
        $set: { platformRole: role._id },
        $unset: { primaryRole: '', platformRoleId: '' },
      }
    );
    migrated += 1;
  }

  if (migrated > 0) {
    console.info(`✅ Migrated ${migrated} user(s) to platformRole ref`);
  }
}
