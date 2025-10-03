// change in fastify

export const errorHandler = (err, req, res, next) => {
  console.error('Global error handler:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message
    });
  }

  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate entry',
      details: 'Slug already exists'
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
};