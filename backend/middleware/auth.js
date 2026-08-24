// backend/src/middleware/auth.js
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/constants.js";

import { User } from "../models/index.js";
export const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id, isDeleted: { $ne: true } }).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

export const authMiddleware = auth;

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (roles.length > 0 && !roles.includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient privileges."
      });
    }
    next();
  };
};

export const checkUniversityAccess = async (req, res, next) => {
  try {
    const userUniversityId = req.user?.universityId?.toString();
    const requestedUniversityId = req.params.id || req.query.universityId || req.body.universityId;

    if (requestedUniversityId && requestedUniversityId !== userUniversityId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only access your own university's data."
      });
    }

    next();
  } catch (error) {
    console.error("University Access Check Error:", error);
    res.status(500).json({
      success: false,
      message: "Access check failed"
    });
  }
};

export default auth;