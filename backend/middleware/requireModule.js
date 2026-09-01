import { serializeModuleAccess } from '../utils/moduleAccessDefaults.js';
import { getPlatformRoleName } from '../utils/userPlatformRole.js';

export const getUserModuleAccess = (user) => {
  if (!user?.moduleAccess) return null;
  return serializeModuleAccess(user.moduleAccess);
};

export const hasModuleAccess = (user, moduleKey) => {
  const access = getUserModuleAccess(user);
  if (!access || Object.keys(access).length === 0) return true;
  return access[moduleKey] === true;
};

export const requireModule =
  (...moduleKeys) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (getPlatformRoleName(req.user) === 'System Admin') {
      return next();
    }

    const access = getUserModuleAccess(req.user);
    if (!access || Object.keys(access).length === 0) {
      return next();
    }

    const allowed = moduleKeys.some((key) => access[key] === true);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required module: ${moduleKeys.join(' or ')}`,
      });
    }

    return next();
  };

export default requireModule;
