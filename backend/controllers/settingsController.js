const Setting = require('../models/Setting');

const defaultSettings = [
  { key: 'contribution_amount', value: 1000, description: 'Monthly contribution amount per member' },
  { key: 'interest_rate', value: 10, description: 'Loan interest rate (%)' },
  { key: 'absence_penalty', value: 500, description: 'Penalty amount for meeting absence' },
  { key: 'late_payment_penalty', value: 200, description: 'Penalty for late payment' },
  { key: 'max_loan_multiplier', value: 3, description: 'Max loan = savings × multiplier' },
  { key: 'group_name', value: 'Community Saving Group', description: 'Name of the saving group' },
  { key: 'currency', value: 'TZS', description: 'Currency used' },
];

// @desc  Get all settings
// @route GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await Setting.find().sort({ key: 1 });
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Initialize default settings
// @route POST /api/settings/init
exports.initSettings = async (req, res) => {
  try {
    for (const s of defaultSettings) {
      await Setting.findOneAndUpdate({ key: s.key }, s, { upsert: true, new: true });
    }
    res.json({ success: true, message: 'Settings initialized with defaults' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update a setting
// @route PUT /api/settings/:key
exports.updateSetting = async (req, res) => {
  try {
    const { value } = req.body;
    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { value, updatedBy: req.user._id },
      { new: true, upsert: true }
    );
    res.json({ success: true, message: 'Setting updated', setting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
