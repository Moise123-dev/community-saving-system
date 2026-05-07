const User = require('../models/User');
const Saving = require('../models/Saving');
const Loan = require('../models/Loan');
const Penalty = require('../models/Penalty');
const Transaction = require('../models/Transaction');

// @desc  Member report
// @route GET /api/reports/members
exports.getMemberReport = async (req, res) => {
  try {
    const members = await User.find({ role: 'member' }).lean();

    const report = await Promise.all(
      members.map(async (m) => {
        const mongoose = require('mongoose');
        const memberId = m._id;

        const [savings, loans, penalties] = await Promise.all([
          Saving.aggregate([
            { $match: { member: memberId, status: 'approved' } },
            { $group: { _id: '$type', total: { $sum: '$amount' } } },
          ]),
          Loan.find({ member: memberId }),
          Penalty.find({ member: memberId }),
        ]);

        const deposits = savings.find((s) => s._id === 'deposit')?.total || 0;
        const withdrawals = savings.find((s) => s._id === 'withdrawal')?.total || 0;

        return {
          member: { id: m._id, name: m.name, email: m.email, phone: m.phone, joinDate: m.joinDate },
          totalSavings: deposits - withdrawals,
          totalLoans: loans.length,
          activeLoans: loans.filter((l) => l.status === 'active').length,
          totalPenalties: penalties.length,
          unpaidPenalties: penalties.filter((p) => p.status === 'unpaid').length,
        };
      })
    );

    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Financial report
// @route GET /api/reports/financial
exports.getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const [savingsSummary, loansSummary, penaltiesSummary, monthlyTrend] = await Promise.all([
      Saving.aggregate([
        { $match: { ...matchStage, status: 'approved' } },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Loan.aggregate([
        { $match: matchStage },
        { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Penalty.aggregate([
        { $match: matchStage },
        { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' }, type: '$type' },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    res.json({ success: true, report: { savingsSummary, loansSummary, penaltiesSummary, monthlyTrend } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Loan report
// @route GET /api/reports/loans
exports.getLoanReport = async (req, res) => {
  try {
    const loans = await Loan.find()
      .populate('member', 'name email phone')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    const summary = {
      total: loans.length,
      pending: loans.filter((l) => l.status === 'pending').length,
      active: loans.filter((l) => l.status === 'active').length,
      completed: loans.filter((l) => l.status === 'completed').length,
      rejected: loans.filter((l) => l.status === 'rejected').length,
      totalDisbursed: loans.filter((l) => ['active', 'completed'].includes(l.status)).reduce((s, l) => s + l.amount, 0),
      totalRepaid: loans.reduce((s, l) => s + l.amountRepaid, 0),
      totalOutstanding: loans.filter((l) => l.status === 'active').reduce((s, l) => s + (l.balance || 0), 0),
    };

    res.json({ success: true, summary, loans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
