const mongoose = require("mongoose");

const merchantSchema = new mongoose.Schema(
  {
    supabaseId: { type: String, required: true, unique: true },
    businessName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    deviceIds: [{ type: String }],
    totalRevenue: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Merchant", merchantSchema);
