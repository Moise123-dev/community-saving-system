const AuditLog = require('../models/AuditLog');

const auditLog = (action, module) => async (req, res, next) => {
  // Store original json method
  const originalJson = res.json.bind(res);

  res.json = async (data) => {
    // Log only successful operations
    if (res.statusCode < 400 && req.user) {
      try {
        await AuditLog.create({
          user: req.user._id,
          action,
          module,
          details: JSON.stringify({ body: req.body, params: req.params }),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      } catch (err) {
        console.error('Audit log error:', err.message);
      }
    }
    return originalJson(data);
  };

  next();
};

module.exports = auditLog;
