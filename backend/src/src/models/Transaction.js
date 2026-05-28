const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    cardUID: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: "Merchant" },
    deviceId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["success", "failed", "reversed"],
      default: "success",
    },
    reversedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reversedAt: { type: Date, default: null },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
