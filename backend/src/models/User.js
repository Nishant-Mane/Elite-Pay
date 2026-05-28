const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  walletBalance: { type: Number, default: 0 },
  totalTransactions: { type: Number, default: 0 },
  totalSpentINR: { type: Number, default: 0 },
  rewardTier: { type: String, default: "Bronze" },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);