const mongoose = require('mongoose');

const repaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentMethod: { type: String, enum: ['cash', 'mobile_money', 'bank_transfer'], default: 'cash' },
  paymentReference: { type: String, trim: true },
  notes: { type: String },
});

const loanSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    interestRate: { type: Number, required: true, default: 10 }, // percentage
    totalDue: { type: Number }, // calculated: amount + interest
    purpose: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'active', 'completed'],
      default: 'pending',
    },
    requestDate: { type: Date, default: Date.now },
    approvalDate: { type: Date },
    dueDate: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    repayments: [repaymentSchema],
    amountRepaid: { type: Number, default: 0 },
    balance: { type: Number },
  },
  { timestamps: true }
);

// Calculate totals before saving
loanSchema.pre('save', function (next) {
  if (this.isModified('amount') || this.isModified('interestRate')) {
    this.totalDue = this.amount + (this.amount * this.interestRate) / 100;
    this.balance = this.totalDue - this.amountRepaid;
  }
  next();
});

module.exports = mongoose.model('Loan', loanSchema);
