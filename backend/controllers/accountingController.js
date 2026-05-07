const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Saving = require('../models/Saving');
const Loan = require('../models/Loan');
const Penalty = require('../models/Penalty');

// @desc  Get all transactions
// @route GET /api/accounting
exports.getTransactions = async (req, res) => {
  try {
    const { type, member, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (type) query.type = type;
    if (member) query.member = member;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .populate('member', 'name email')
      .populate('recordedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get dashboard statistics
// @route GET /api/accounting/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalMembers,
      activeMembers,
      totalSavingsAgg,
      activeLoans,
      pendingLoans,
      unpaidPenalties,
      recentTransactions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Saving.aggregate([
        { $match: { status: 'approved' } },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]),
      Loan.countDocuments({ status: 'active' }),
      Loan.countDocuments({ status: 'pending' }),
      Penalty.aggregate([
        { $match: { status: 'unpaid' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Transaction.find()
        .populate('member', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const deposits = totalSavingsAgg.find((s) => s._id === 'deposit')?.total || 0;
    const withdrawals = totalSavingsAgg.find((s) => s._id === 'withdrawal')?.total || 0;

    res.json({
      success: true,
      stats: {
        totalMembers,
        activeMembers,
        totalSavings: deposits - withdrawals,
        activeLoans,
        pendingLoans,
        unpaidPenalties: unpaidPenalties[0]?.count || 0,
        totalPenaltyAmount: unpaidPenalties[0]?.total || 0,
        recentTransactions,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get cash flow data
// @route GET /api/accounting/cashflow
exports.getCashFlow = async (req, res) => {
  try {
    const cashFlow = await Transaction.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 60 },
    ]);

    res.json({ success: true, cashFlow });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
