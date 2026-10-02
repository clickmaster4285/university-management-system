import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { mapPrimaryRoleToLegacyRole } from './moduleAccessDefaults.js';
import { getModuleAccessForRole } from './platformRoleAccess.js';
import { findPlatformRoleByName } from './userPlatformRole.js';

const notDeleted = { $ne: true };

export function generateTemporaryPassword(length = 12) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
  const bytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i += 1) {
    password += alphabet[bytes[i] % alphabet.length];
  }
  return password;
}

/**
 * Create or link a Student portal User. Mutates `student.userId` and saves.
 * @returns {{ portalLogin: { email: string, temporaryPassword: string | null } | null, linkedExisting: boolean, error?: string }}
 */
export async function ensureStudentPortalAccount(student, { password } = {}) {
  if (!student?.email) {
    return { portalLogin: null, linkedExisting: false, error: 'Student email is required for portal login' };
  }

  if (student.userId) {
    return { portalLogin: null, linkedExisting: true };
  }

  const email = String(student.email).trim().toLowerCase();
  const existingUser = await User.findOne({ email, isDeleted: notDeleted });

  if (existingUser) {
    if (existingUser.role !== 'Student') {
      return {
        portalLogin: null,
        linkedExisting: false,
        error: `Email ${email} belongs to a non-student account`,
      };
    }
    student.userId = existingUser._id;
    await student.save();
    return {
      portalLogin: { email, temporaryPassword: null },
      linkedExisting: true,
    };
  }

  const platformRole = await findPlatformRoleByName('Student');
  if (!platformRole) {
    return {
      portalLogin: null,
      linkedExisting: false,
      error: 'Platform role "Student" is not configured',
    };
  }

  const temporaryPassword =
    password && String(password).length >= 8 ? String(password) : generateTemporaryPassword();
  const access = await getModuleAccessForRole('Student');
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  const user = await User.create({
    firstName: student.firstName,
    lastName: student.lastName,
    email,
    phoneNumber: student.phone || '',
    password: hashedPassword,
    role: mapPrimaryRoleToLegacyRole('Student'),
    platformRole: platformRole._id,
    moduleAccess: access,
    status: 'Active',
  });

  student.userId = user._id;
  await student.save();

  return {
    portalLogin: { email, temporaryPassword },
    linkedExisting: false,
  };
}
