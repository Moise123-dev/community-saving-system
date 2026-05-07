const Saving = require('../models/Saving');
const Transaction = require('../models/Transaction');

// @desc  Get all savings
// @route GET /api/savings
exports.getSavings = async (req, res) => {
  try {
    const { member, month, type, page = 1, limit = 20 } = req.query;
    const query = {};

    if (member) query.member = member;
    if (month) query.month = month;
    if (type) query.type = type;

    // Members can only see their own savings
    if (req.user.role === 'member') query.member = req.user._id;

    const total = await Saving.countDocuments(query);
    const savings = await Saving.find(query)
      .populate('member', 'name email phone')
      .populate('recordedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, savings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get my savings
// @route GET /api/savings/my
exports.getMySavings = async (req, res) => {
  try {
    const savings = await Saving.find({ member: req.user._id })
      .sort({ createdAt: -1 });
    const total = savings.reduce((sum, s) => s.type === 'deposit' ? sum + s.amount : sum - s.amount, 0);
    res.json({ success: true, savings, totalBalance: total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get savings summary
// @route GET /api/savings/summary
exports.getSavingsSummary = async (req, res) => {
  try {
    const summary = await Saving.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const monthlyTrend = await Saving.aggregate([
      { $match: { type: 'deposit', status: 'approved' } },
      {
        $group: {
          _id: '$month',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 12 },
    ]);

    res.json({ success: true, summary, monthlyTrend });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Record saving deposit/withdrawal
// @route POST /api/savings
// @access Both roles — members deposit for themselves, managers for any member
exports.createSaving = async (req, res) => {
  try {
    const { amount, type, month, notes, receiptNumber, paymentMethod, mobileMoneyRef } = req.body;

    // Members always save for themselves; managers specify a member
    const memberId = req.user.role === 'manager'
      ? (req.body.member || req.user._id)
      : req.user._id;

    // Members can only deposit, not withdraw
    const savingType = req.user.role === 'member' ? 'deposit' : (type || 'deposit');

    const saving = await Saving.create({
      member: memberId,
      amount,
      type: savingType,
      month: month || new Date().toISOString().slice(0, 7),
      notes,
      receiptNumber,
      paymentMethod: paymentMethod || 'cash',
      mobileMoneyRef,
      recordedBy: req.user._id,
      // Member deposits start as pending (manager approves); manager entries auto-approved
      status: req.user.role === 'manager' ? 'approved' : 'pending',
    });

    // Record in accounting (only for approved)
    if (saving.status === 'approved') {
      await Transaction.create({
        type: savingType === 'withdrawal' ? 'saving_withdrawal' : 'saving_deposit',
        amount,
        member: memberId,
        reference: saving._id.toString(),
        referenceModel: 'Saving',
        description: `Saving ${savingType} for ${month}`,
        recordedBy: req.user._id,
      });
    }

    await saving.populate('member', 'name email');
    res.status(201).json({ success: true, message: 'Saving recorded successfully', saving });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update saving record
// @route PUT /api/savings/:id
exports.updateSaving = async (req, res) => {
  try {
    const saving = await Saving.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('member', 'name email');

    if (!saving) return res.status(404).json({ success: false, message: 'Saving record not found' });
    res.json({ success: true, message: 'Saving updated', saving });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete saving record
// @route DELETE /api/savings/:id
exports.deleteSaving = async (req, res) => {
  try {
    const saving = await Saving.findByIdAndDelete(req.params.id);
    if (!saving) return res.status(404).json({ success: false, message: 'Saving record not found' });
    res.json({ success: true, message: 'Saving record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
