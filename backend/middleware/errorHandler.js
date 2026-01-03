// Helper function to get allowed origins (same logic as server.js)
const getAllowedOrigins = () => {
  // Check if FRONTEND_URL is explicitly set (highest priority)
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL.split(',').map(url => url.trim());
  }
  
  // Determine if we're in production
  // Render always sets PORT, and NODE_ENV might be 'production' or undefined
  const isProduction = process.env.NODE_ENV === 'production' || 
                       process.env.RENDER === 'true' || 
                       process.env.RENDER ||
                       (process.env.PORT && process.env.NODE_ENV !== 'development');
  
  if (isProduction) {
    return ['https://foodexpress-frontend-tmf7.onrender.com'];
  }
  
  // Default to development origins
  return ['http://localhost:5173', 'http://localhost:5174'];
};

export const errorHandler = (err, req, res, next) => {
  // Enhanced error logging for production
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    error: {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      name: err.name,
      status: err.status || 500
    }
  };

  // Log to console with structured format
  console.error('Error Details:', JSON.stringify(errorLog, null, 2));
  
  // Also log stack trace in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack Trace:', err.stack);
  }

  // Set CORS headers explicitly for all error responses
  const allowedOrigins = getAllowedOrigins();
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.length > 0) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      message: 'Duplicate field value entered',
      errors: Object.keys(err.keyValue).map(key => `${key} already exists`)
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  // Default error - ensure CORS headers are set
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}; 