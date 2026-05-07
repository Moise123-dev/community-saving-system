const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['saving_deposit', 'saving_withdrawal', 'loan_disbursement', 'loan_repayment', 'penalty_payment', 'expense', 'income'],
      required: true,
    },
    amount: { type: Number, required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reference: { type: String }, // ref to saving/loan/penalty ID
    referenceModel: { type: String, enum: ['Saving', 'Loan', 'Penalty'] },
    description: { type: String, trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    balanceAfter: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
