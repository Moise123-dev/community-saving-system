const mongoose = require('mongoose');

const penaltySchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true },
    type: { type: String, enum: ['absence', 'late_payment', 'misconduct', 'other'], default: 'other' },
    status: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paidDate: { type: Date },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paymentMethod: { type: String, enum: ['cash', 'mobile_money', 'bank_transfer'], default: 'cash' },
    paymentReference: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Penalty', penaltySchema);
