export const handle = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    console.error(`❌ ${fn.name} Error:`, error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation failed. Please check the provided data.",
        error: error.message,
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid identifier format.",
        error: error.message,
      });
    }
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate value. A record with this value already exists.",
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};