const Penalty = require('../models/Penalty');
const Transaction = require('../models/Transaction');

// @desc  Get all penalties
// @route GET /api/penalties
exports.getPenalties = async (req, res) => {
  try {
    const { status, member, type, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (req.user.role === 'member') {
      query.member = req.user._id;
    } else if (member) {
      query.member = member;
    }

    const total = await Penalty.countDocuments(query);
    const penalties = await Penalty.find(query)
      .populate('member', 'name email phone')
      .populate('issuedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, penalties });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create penalty
// @route POST /api/penalties
exports.createPenalty = async (req, res) => {
  try {
    const { member, amount, reason, type, notes } = req.body;

    const penalty = await Penalty.create({
      member,
      amount,
      reason,
      type: type || 'other',
      notes,
      issuedBy: req.user._id,
    });

    await penalty.populate('member', 'name email');
    res.status(201).json({ success: true, message: 'Penalty assigned', penalty });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update penalty
// @route PUT /api/penalties/:id
exports.updatePenalty = async (req, res) => {
  try {
    const penalty = await Penalty.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('member', 'name email');
    if (!penalty) return res.status(404).json({ success: false, message: 'Penalty not found' });
    res.json({ success: true, penalty });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Mark penalty as paid — manager marks any, member pays their own
// @route PUT /api/penalties/:id/pay
exports.markPaid = async (req, res) => {
  try {
    const penalty = await Penalty.findById(req.params.id);
    if (!penalty) return res.status(404).json({ success: false, message: 'Penalty not found' });

    // Members can only pay their own penalties
    if (req.user.role === 'member') {
      if (penalty.member.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'You can only pay your own penalties' });
      }
    }

    if (penalty.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Penalty is already paid' });
    }

    const { paymentMethod, paymentReference, notes } = req.body;

    penalty.status = 'paid';
    penalty.paidDate = new Date();
    penalty.paidBy = req.user._id;
    penalty.paymentMethod = paymentMethod || 'cash';
    penalty.paymentReference = paymentReference || '';
    if (notes) penalty.notes = notes;
    await penalty.save();

    // Record transaction
    await Transaction.create({
      type: 'penalty_payment',
      amount: penalty.amount,
      member: penalty.member,
      reference: penalty._id.toString(),
      referenceModel: 'Penalty',
      description: `Penalty payment: ${penalty.reason} via ${paymentMethod || 'cash'}`,
      recordedBy: req.user._id,
    });

    await penalty.populate('member', 'name email');
    res.json({ success: true, message: 'Penalty paid successfully', penalty });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete penalty
// @route DELETE /api/penalties/:id
exports.deletePenalty = async (req, res) => {
  try {
    const penalty = await Penalty.findByIdAndDelete(req.params.id);
    if (!penalty) return res.status(404).json({ success: false, message: 'Penalty not found' });
    res.json({ success: true, message: 'Penalty deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
