const User = require("../models/User");
const Merchant = require("../models/Merchant");
const Transaction = require("../models/Transaction");
const Card = require("../models/Card");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllMerchants = async (req, res) => {
  try {
    const merchants = await Merchant.find().sort({ createdAt: -1 });
    res.json({ merchants });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("userId", "name email")
      .populate("merchantId", "businessName")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.freezeUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndUpdate(userId, { status: "frozen" });
    res.json({ status: "success", message: "User frozen" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.unfreezeUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndUpdate(userId, { status: "active" });
    res.json({ status: "success", message: "User unfrozen" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.freezeCard = async (req, res) => {
  try {
    const { cardUID } = req.body;
    await Card.findOneAndUpdate({ cardUID }, { status: "frozen" });
    res.json({ status: "success", message: "Card frozen" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Reverse a transaction — refund balance to user
exports.reverseTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const adminSupabaseId = req.user.sub;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    if (transaction.status === "reversed") {
      return res.status(400).json({ message: "Already reversed" });
    }

    // Refund user
    await User.findByIdAndUpdate(transaction.userId, {
      $inc: { walletBalance: transaction.amount, totalSpentINR: -transaction.amount },
    });

    // Deduct from merchant
    if (transaction.merchantId) {
      await Merchant.findByIdAndUpdate(transaction.merchantId, {
        $inc: { totalRevenue: -transaction.amount },
      });
    }

    transaction.status = "reversed";
    transaction.reversedAt = new Date();
    await transaction.save();

    res.json({ status: "success", message: "Transaction reversed" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getSystemStats = async (req, res) => {
  try {
    const [totalUsers, totalMerchants, totalTransactions, successTxns] = await Promise.all([
      User.countDocuments(),
      Merchant.countDocuments(),
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: "success" }),
    ]);

    const volumeResult = await Transaction.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      totalUsers,
      totalMerchants,
      totalTransactions,
      successRate: totalTransactions ? ((successTxns / totalTransactions) * 100).toFixed(1) : 0,
      totalVolume: volumeResult[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
