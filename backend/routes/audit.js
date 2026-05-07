const express = require('express');
const router = express.Router();
const { protect, managerOnly } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// @desc  Get audit logs
// @route GET /api/audit
router.get('/', protect, managerOnly, async (req, res) => {
  try {
    const { page = 1, limit = 30, module, user } = req.query;
    const query = {};
    if (module) query.module = module;
    if (user) query.user = user;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
