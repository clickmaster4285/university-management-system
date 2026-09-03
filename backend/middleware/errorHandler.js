// Not found handler
export function notFoundHandler(req, res, next) {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.status = 404;
  next(error);
}

// Global error handler
export function errorHandler(err, req, res, next) {
  // Log error
  console.error(`❌ Error: ${err.message}`);
  console.error(err.stack);

  if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Maximum size is 10 MB.'
        : err.message || 'File upload failed';
    return res.status(400).json({ success: false, message });
  }

  if (err.message?.includes('Unsupported file type')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Default error
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Send response
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.details || null
    })
  });
}

// Custom error classes (optional)
export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400);
    this.details = details;
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}