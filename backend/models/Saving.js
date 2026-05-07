const mongoose = require('mongoose');

const savingSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['deposit', 'withdrawal'], default: 'deposit' },
    month: { type: String, required: true }, // e.g. "2024-01"
    notes: { type: String, trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    // New fields
    receiptNumber: { type: String, trim: true },
    paymentMethod: { type: String, enum: ['cash', 'mobile_money', 'bank_transfer', 'cheque'], default: 'cash' },
    mobileMoneyRef: { type: String, trim: true }, // transaction ref for mobile money
  },
  { timestamps: true }
);

module.exports = mongoose.model('Saving', savingSchema);
