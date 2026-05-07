const Loan = require('../models/Loan');
const Saving = require('../models/Saving');
const Transaction = require('../models/Transaction');
const Setting = require('../models/Setting');
const mongoose = require('mongoose');

// Helper — calculate a member's approved savings balance
async function getMemberSavingsBalance(memberId) {
  const result = await Saving.aggregate([
    {
      $match: {
        member: new mongoose.Types.ObjectId(memberId),
        status: 'approved',
      },
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
      },
    },
  ]);
  const deposits = result.find(r => r._id === 'deposit')?.total || 0;
  const withdrawals = result.find(r => r._id === 'withdrawal')?.total || 0;
  return deposits - withdrawals;
}

// @desc  Get member loan eligibility (balance + max allowed)
// @route GET /api/loans/eligibility/:memberId
exports.getMemberEligibility = async (req, res) => {
  try {
    const { memberId } = req.params;

    // Get savings balance
    const savingsBalance = await getMemberSavingsBalance(memberId);

    // Get max_loan_multiplier from settings (default 3)
    const multiplierSetting = await Setting.findOne({ key: 'max_loan_multiplier' });
    const multiplier = multiplierSetting ? Number(multiplierSetting.value) : 3;

    // Get interest rate
    const interestSetting = await Setting.findOne({ key: 'interest_rate' });
    const interestRate = interestSetting ? Number(interestSetting.value) : 10;

    // Max loan = savings balance × multiplier
    const maxLoanAmount = savingsBalance * multiplier;

    // Check existing active loans balance
    const activeLoans = await Loan.find({
      member: memberId,
      status: { $in: ['active', 'approved'] },
    });
    const existingLoanBalance = activeLoans.reduce((s, l) => s + (l.balance || 0), 0);

    // Available credit = max loan - existing active loan balance
    const availableCredit = Math.max(0, maxLoanAmount - existingLoanBalance);

    res.json({
      success: true,
      eligibility: {
        savingsBalance,
        multiplier,
        maxLoanAmount,
        existingLoanBalance,
        availableCredit,
        interestRate,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getLoans = async (req, res) => {
  try {
    const { status, member, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (req.user.role === 'member') {
      query.member = req.user._id;
    } else if (member) {
      query.member = member;
    }

    const total = await Loan.countDocuments(query);
    const loans = await Loan.find(query)
      .populate('member', 'name email phone')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, loans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get my loans
// @route GET /api/loans/my
exports.getMyLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ member: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, loans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single loan
// @route GET /api/loans/:id
exports.getLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('member', 'name email phone')
      .populate('approvedBy', 'name')
      .populate('repayments.recordedBy', 'name');

    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

    // Members can only see their own loans
    if (req.user.role === 'member' && loan.member._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, loan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Request a loan
// @route POST /api/loans
exports.requestLoan = async (req, res) => {
  try {
    const { amount, purpose, dueDate } = req.body;

    // Get interest rate from settings
    const interestSetting = await Setting.findOne({ key: 'interest_rate' });
    const interestRate = interestSetting ? Number(interestSetting.value) : 10;

    const memberId = req.user.role === 'manager' ? req.body.member || req.user._id : req.user._id;

    const loan = await Loan.create({
      member: memberId,
      amount,
      interestRate,
      totalDue: amount + (amount * interestRate) / 100,
      balance: amount + (amount * interestRate) / 100,
      purpose,
      dueDate,
    });

    await loan.populate('member', 'name email');
    res.status(201).json({ success: true, message: 'Loan request submitted', loan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Approve loan — checks member savings balance vs max_loan_multiplier
// @route PUT /api/loans/:id/approve
exports.approveLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('member', 'name email');
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loan.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Loan is not in pending status' });
    }

    // ── Balance eligibility check ──
    const savingsBalance = await getMemberSavingsBalance(loan.member._id);

    const multiplierSetting = await Setting.findOne({ key: 'max_loan_multiplier' });
    const multiplier = multiplierSetting ? Number(multiplierSetting.value) : 3;
    const maxLoanAmount = savingsBalance * multiplier;

    // Existing active loan balances for this member
    const activeLoans = await Loan.find({
      member: loan.member._id,
      status: { $in: ['active'] },
      _id: { $ne: loan._id },
    });
    const existingLoanBalance = activeLoans.reduce((s, l) => s + (l.balance || 0), 0);
    const availableCredit = Math.max(0, maxLoanAmount - existingLoanBalance);

    // Block if requested amount exceeds available credit
    if (loan.amount > availableCredit) {
      return res.status(400).json({
        success: false,
        message: `Cannot approve. Member's savings balance is TZS ${savingsBalance.toLocaleString()}. Max eligible loan is TZS ${maxLoanAmount.toLocaleString()} (${multiplier}× savings). Available credit after existing loans: TZS ${availableCredit.toLocaleString()}.`,
        eligibility: { savingsBalance, maxLoanAmount, availableCredit, multiplier },
      });
    }

    // ── Approve ──
    loan.status = 'active';
    loan.approvalDate = new Date();
    loan.approvedBy = req.user._id;
    await loan.save();

    // Record disbursement transaction
    await Transaction.create({
      type: 'loan_disbursement',
      amount: loan.amount,
      member: loan.member._id,
      reference: loan._id.toString(),
      referenceModel: 'Loan',
      description: `Loan of TZS ${loan.amount.toLocaleString()} approved for ${loan.member.name}`,
      recordedBy: req.user._id,
    });

    await loan.populate('approvedBy', 'name');
    res.json({
      success: true,
      message: `Loan approved. Member savings: TZS ${savingsBalance.toLocaleString()}, Loan: TZS ${loan.amount.toLocaleString()}`,
      loan,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Reject loan
// @route PUT /api/loans/:id/reject
exports.rejectLoan = async (req, res) => {
  try {
    const loan = await Loan.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', approvedBy: req.user._id },
      { new: true }
    ).populate('member', 'name email');

    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    res.json({ success: true, message: 'Loan rejected', loan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Record loan repayment — both roles, members can only repay their own loans
// @route POST /api/loans/:id/repay
exports.repayLoan = async (req, res) => {
  try {
    const { amount, notes, paymentMethod, paymentReference } = req.body;
    const loan = await Loan.findById(req.params.id).populate('member', 'name email');

    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

    // Members can only repay their own loans
    if (req.user.role === 'member' && loan.member._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only repay your own loans' });
    }

    if (loan.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Loan is not active' });
    }

    const repayAmount = Number(amount);
    if (repayAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Repayment amount must be greater than 0' });
    }
    if (repayAmount > loan.balance) {
      return res.status(400).json({ success: false, message: `Amount exceeds outstanding balance of TZS ${loan.balance.toLocaleString()}` });
    }

    loan.repayments.push({
      amount: repayAmount,
      recordedBy: req.user._id,
      notes,
      paymentMethod: paymentMethod || 'cash',
      paymentReference: paymentReference || '',
    });
    loan.amountRepaid += repayAmount;
    loan.balance = loan.totalDue - loan.amountRepaid;

    if (loan.balance <= 0) {
      loan.status = 'completed';
      loan.balance = 0;
    }

    await loan.save();

    // Record repayment transaction
    await Transaction.create({
      type: 'loan_repayment',
      amount: repayAmount,
      member: loan.member._id,
      reference: loan._id.toString(),
      referenceModel: 'Loan',
      description: `Loan repayment via ${paymentMethod || 'cash'}. Remaining balance: TZS ${loan.balance.toLocaleString()}`,
      recordedBy: req.user._id,
    });

    res.json({
      success: true,
      message: loan.status === 'completed'
        ? '🎉 Loan fully repaid and completed!'
        : `Repayment recorded. Remaining balance: TZS ${loan.balance.toLocaleString()}`,
      loan,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
