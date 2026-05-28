const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: "Merchant", default: null },
  cardUID: { type: String },
  deviceId: { type: String },
  amount: { type: Number, required: true },
  type: { type: String, enum: ["topup", "payment", "tap"], default: "payment" },
  status: { type: String, enum: ["success", "failed", "pending"], default: "success" },
  note: { type: String, default: "" },
  razorpayOrderId: { type: String, default: null },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Transaction", transactionSchema);