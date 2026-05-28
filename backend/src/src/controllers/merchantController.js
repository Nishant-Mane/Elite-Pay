const Merchant = require("../models/Merchant");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

exports.syncMerchant = async (req, res) => {
  try {
    const supabaseId = req.user.sub;
    const { businessName, email } = req.body;

    let merchant = await Merchant.findOne({ supabaseId });
    if (!merchant) {
      merchant = new Merchant({ supabaseId, businessName, email });
      await merchant.save();
    }

    res.json({ status: "success", merchantId: merchant._id });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const supabaseId = req.user.sub;
    const merchant = await Merchant.findOne({ supabaseId });
    if (!merchant) return res.status(404).json({ message: "Merchant not found" });
    res.json({ merchant });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const supabaseId = req.user.sub;
    const merchant = await Merchant.findOne({ supabaseId });
    if (!merchant) return res.status(404).json({ message: "Merchant not found" });

    const transactions = await Transaction.find({ merchantId: merchant._id })
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Merchant enters the amount the user needs to pay — this is sent to ESP32
exports.createPaymentRequest = async (req, res) => {
  try {
    const { amount, cardUID } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // This just returns the amount for the ESP32 to use
    // The actual deduction happens when the ESP32 POSTs to /tap
    res.json({ status: "success", amount: Number(amount), cardUID });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
