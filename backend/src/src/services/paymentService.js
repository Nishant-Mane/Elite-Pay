const User = require("../models/User");
const Card = require("../models/Card");
const Transaction = require("../models/Transaction");
const Merchant = require("../models/Merchant");
const rewardService = require("./rewardService");

exports.processTapPayment = async (deviceId, cardUID, amount) => {
  if (!amount || isNaN(amount) || amount <= 0) {
    return { status: "denied", message: "Invalid amount" };
  }

  const card = await Card.findOne({ cardUID });
  if (!card) return { status: "denied", message: "Card not registered" };
  if (card.status !== "active") return { status: "denied", message: "Card is frozen" };

  const user = await User.findById(card.userId);
  if (!user) return { status: "denied", message: "User not found" };
  if (user.status !== "active") return { status: "denied", message: "Account is frozen" };
  if (user.walletBalance < amount) return { status: "denied", message: "Insufficient balance" };

  // Find merchant by deviceId
  const merchant = await Merchant.findOne({ deviceIds: deviceId });

  // Deduct balance
  user.walletBalance -= amount;
  user.totalSpentINR += amount;
  user.totalTransactions += 1;
  await user.save();

  // Update merchant revenue
  if (merchant) {
    merchant.totalRevenue += amount;
    await merchant.save();
  }

  // Save transaction
  const transaction = new Transaction({
    cardUID,
    userId: user._id,
    merchantId: merchant?._id || null,
    deviceId,
    amount,
    status: "success",
  });
  await transaction.save();

  // Check milestone rewards
  const milestoneResult = await rewardService.checkMilestone(user);

  return {
    status: "approved",
    balance: user.walletBalance,
    totalSpentINR: user.totalSpentINR,
    milestoneUnlocked: milestoneResult.unlocked,
    milestoneIndex: milestoneResult.index ?? null,
    transactionId: transaction._id,
  };
};
