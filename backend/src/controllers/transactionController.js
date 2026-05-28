const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Merchant = require("../models/Merchant");

exports.getUserTransactions = async (req, res) => {
  try {
    const txns = await Transaction.find({ userId: req.userId })
      .sort({ timestamp: -1 })
      .limit(50)
      .populate("merchantId", "businessName name");
    res.json(txns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMerchantTransactions = async (req, res) => {
  try {
    const txns = await Transaction.find({ merchantId: req.userId })
      .sort({ timestamp: -1 })
      .limit(100)
      .populate("userId", "name email");
    res.json(txns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: get all
exports.getAllTransactions = async (req, res) => {
  try {
    const txns = await Transaction.find()
      .sort({ timestamp: -1 })
      .limit(200)
      .populate("userId", "name email")
      .populate("merchantId", "businessName name");
    res.json(txns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: summary stats
exports.getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalMerchants, totalTxns] = await Promise.all([
      User.countDocuments(),
      Merchant.countDocuments(),
      Transaction.countDocuments()
    ]);
    const revenue = await Transaction.aggregate([
      { $match: { type: "payment", status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const topupTotal = await Transaction.aggregate([
      { $match: { type: "topup", status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    res.json({
      totalUsers,
      totalMerchants,
      totalTransactions: totalTxns,
      totalRevenue: revenue[0]?.total || 0,
      totalTopups: topupTotal[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllMerchants = async (req, res) => {
  try {
    const merchants = await Merchant.find().select("-password").sort({ createdAt: -1 });
    res.json(merchants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
