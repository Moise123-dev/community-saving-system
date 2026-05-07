const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['manager', 'member'], default: 'member' },
    isActive: { type: Boolean, default: true },
    joinDate: { type: Date, default: Date.now },
    profilePhoto: { type: String, default: '' },
    nationalId: { type: String, trim: true },
    address: { type: String, trim: true },
    // New fields
    occupation: { type: String, trim: true },
    emergencyContact: { type: String, trim: true },
    emergencyPhone: { type: String, trim: true },
    nextOfKin: { type: String, trim: true },
    nextOfKinPhone: { type: String, trim: true },
    nextOfKinRelationship: { type: String, trim: true },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
