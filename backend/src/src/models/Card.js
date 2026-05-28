const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    cardUID: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["active", "frozen", "lost"], default: "active" },
    label: { type: String, default: "My Card" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Card", cardSchema);
