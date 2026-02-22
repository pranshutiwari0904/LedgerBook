export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Server error';

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource id';
  }

  if (error.name === 'ValidationError') {
    statusCode = 400;
    const firstKey = Object.keys(error.errors || {})[0];
    message = firstKey ? error.errors[firstKey].message : 'Validation failed';
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = 'Duplicate value found';
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};
