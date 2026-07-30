import jwt from 'jsonwebtoken';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const auth = async (req, res, next) => {
  // For development, bypass auth if in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('🔓 Development mode - bypassing auth');
    req.user = {
      id: 'dev-user-id',
      email: 'dev@test.com',
      role: 'admin'
    };
    req.userId = 'dev-user-id';
    return next();
  }
  
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.'
      });
    }

    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development';
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Token verified for user:', decoded.email || decoded.id);
      req.user = decoded;
      req.userId = decoded.id || decoded.userId;
      next();
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError.message);
      
      // In development, bypass auth on token error
      if (process.env.NODE_ENV === 'development') {
        console.log('🔓 Development mode - bypassing auth on token error');
        req.user = {
          id: 'dev-user-id',
          email: 'dev@test.com',
          role: 'admin'
        };
        req.userId = 'dev-user-id';
        return next();
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.'
        });
      }
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please login again.'
        });
      }
      
      throw jwtError;
    }
  } catch (error) {
    console.error('❌ Auth error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Authentication failed. Please login again.'
    });
  }
};

/**
 * Optional auth middleware - doesn't require authentication but adds user if available
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development';
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      req.userId = decoded.id || decoded.userId;
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

export default auth;