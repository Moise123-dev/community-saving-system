const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// @desc  Register user
// @route POST /api/auth/register
// @access Public (first manager) / Manager only after
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, email, password, phone, role, nationalId, address } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // First user becomes manager automatically
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'manager' : role || 'member';

    const user = await User.create({ name, email, password, phone, role: assignedRole, nationalId, address });

    await AuditLog.create({
      user: user._id,
      action: 'REGISTER',
      module: 'Auth',
      details: `User ${name} registered as ${assignedRole}`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token: generateToken(user._id),
      user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Login user
// @route POST /api/auth/login
// @access Public
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    await AuditLog.create({
      user: user._id,
      action: 'LOGIN',
      module: 'Auth',
      details: `User ${user.name} logged in`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      token: generateToken(user._id),
      user: { ...user.toJSON() },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get current user
// @route GET /api/auth/me
// @access Private
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @desc  Update password
// @route PUT /api/auth/update-password
// @access Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
