// backend/src/middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id).select('-password');

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

export const superAdminOnly = async (req, res, next) => {
  if (req.user?.role !== 'Super Admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Super Admin privileges required."
    });
  }
  next();
};

export const checkUniversityAccess = async (req, res, next) => {
  try {
    const userUniversityId = req.user?.universityId?.toString();
    const requestedUniversityId = req.params.id || req.query.universityId || req.body.universityId;

    if (req.user?.role === 'Super Admin') {
      return next();
    }

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