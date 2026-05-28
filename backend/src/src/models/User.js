const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    supabaseId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    walletBalance: { type: Number, default: 0 },
    totalSpentINR: { type: Number, default: 0 },
    totalTransactions: { type: Number, default: 0 },
    walletAddress: { type: String, default: null },
    rewardsClaimed: [
      {
        milestoneIndex: Number,
        txHash: String,
        claimedAt: Date,
      },
    ],
    status: { type: String, enum: ["active", "frozen"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
