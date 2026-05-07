const User = require('../models/User');
const Saving = require('../models/Saving');
const Loan = require('../models/Loan');
const Penalty = require('../models/Penalty');

// @desc  Get all members
// @route GET /api/members
exports.getMembers = async (req, res) => {
  try {
    const { search, role, isActive, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const total = await User.countDocuments(query);
    const members = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single member
// @route GET /api/members/:id
exports.getMember = async (req, res) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get member financial summary
// @route GET /api/members/:id/summary
exports.getMemberSummary = async (req, res) => {
  try {
    const memberId = req.params.id;

    const [totalSavings, activeLoans, unpaidPenalties] = await Promise.all([
      Saving.aggregate([
        { $match: { member: require('mongoose').Types.ObjectId.createFromHexString(memberId), type: 'deposit', status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Loan.find({ member: memberId, status: { $in: ['active', 'approved'] } }),
      Penalty.find({ member: memberId, status: 'unpaid' }),
    ]);

    res.json({
      success: true,
      summary: {
        totalSavings: totalSavings[0]?.total || 0,
        activeLoans: activeLoans.length,
        totalLoanBalance: activeLoans.reduce((sum, l) => sum + (l.balance || 0), 0),
        unpaidPenalties: unpaidPenalties.length,
        totalPenaltyAmount: unpaidPenalties.reduce((sum, p) => sum + p.amount, 0),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create member
// @route POST /api/members
exports.createMember = async (req, res) => {
  try {
    const { name, email, password, phone, role, nationalId, address } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });

    const member = await User.create({
      name,
      email,
      password: password || 'Password@123',
      phone,
      role: role || 'member',
      nationalId,
      address,
    });

    res.status(201).json({ success: true, message: 'Member created successfully', member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update member
// @route PUT /api/members/:id
exports.updateMember = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    const member = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, message: 'Member updated successfully', member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete (deactivate) member
// @route DELETE /api/members/:id
exports.deleteMember = async (req, res) => {
  try {
    const member = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, message: 'Member deactivated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
