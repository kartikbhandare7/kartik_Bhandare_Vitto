const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  // Sequelize: duplicate PAN (unique constraint)
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors?.[0]?.path || 'field';
    return res.status(409).json({
      success: false,
      error: 'DUPLICATE_ENTRY',
      message: `A record with this ${field} already exists`,
    });
  }

  // Sequelize: field validation failed
  if (err.name === 'SequelizeValidationError') {
    const details = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Database validation failed',
      details,
    });
  }

  // Everything else
  const status = err.statusCode || err.status || 500;
  return res.status(status).json({
    success: false,
    error: err.code || 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message,
  });
};

// Called when no route matches the URL
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} does not exist`,
  });
};

module.exports = { errorHandler, notFound };