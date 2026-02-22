export const requireDatabase = (req, res, next) => {
  const getDbReady = req.app.get('dbReady');
  const isDbReady = typeof getDbReady === 'function' ? getDbReady() : false;

  if (!isDbReady) {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable. Start MongoDB and retry.'
    });
  }

  return next();
};
