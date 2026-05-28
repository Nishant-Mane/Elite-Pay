const User = require("../models/User");
const Transaction = require("../models/Transaction");
const rewardService = require("../services/rewardService");
const { ethers } = require("ethers");
const MilestoneRewards = require("../abi/MilestoneRewards.json");

// Get user profile + milestone info
exports.getProfile = async (req, res) => {
  try {
    const supabaseId = req.user.sub;
    const user = await User.findOne({ supabaseId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const nextMilestone = rewardService.getNextMilestone(user.totalSpentINR);
    const milestones = rewardService.getMilestones();

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        walletBalance: user.walletBalance,
        totalSpentINR: user.totalSpentINR,
        totalTransactions: user.totalTransactions,
        walletAddress: user.walletAddress,
        rewardsClaimed: user.rewardsClaimed,
        status: user.status,
      },
      milestones,
      nextMilestone,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Register/sync user from Supabase (called on first login)
exports.syncUser = async (req, res) => {
  try {
    const supabaseId = req.user.sub;
    const { name, email } = req.body;

    let user = await User.findOne({ supabaseId });
    if (!user) {
      user = new User({ supabaseId, name, email });
      await user.save();
    }

    res.json({ status: "success", userId: user._id });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get transaction history for user
exports.getTransactions = async (req, res) => {
  try {
    const supabaseId = req.user.sub;
    const user = await User.findOne({ supabaseId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const transactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Save ETH wallet address
exports.saveWalletAddress = async (req, res) => {
  try {
    const supabaseId = req.user.sub;
    const { walletAddress } = req.body;

    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({ message: "Invalid Ethereum address" });
    }

    await User.findOneAndUpdate({ supabaseId }, { walletAddress });
    res.json({ status: "success" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Claim ETH milestone reward — calls smart contract
exports.claimReward = async (req, res) => {
  try {
    const supabaseId = req.user.sub;
    const { milestoneIndex } = req.body;

    const user = await User.findOne({ supabaseId });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.walletAddress) return res.status(400).json({ message: "No wallet address linked" });

    const milestones = rewardService.getMilestones();
    if (milestoneIndex < 0 || milestoneIndex >= milestones.length) {
      return res.status(400).json({ message: "Invalid milestone index" });
    }

    if (user.totalSpentINR < milestones[milestoneIndex]) {
      return res.status(400).json({ message: "Milestone not yet reached" });
    }

    const alreadyClaimed = user.rewardsClaimed.some((r) => r.milestoneIndex === milestoneIndex);
    if (alreadyClaimed) return res.status(400).json({ message: "Reward already claimed" });

    // Call smart contract
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      MilestoneRewards,
      wallet
    );

    const tx = await contract.claimReward(user.walletAddress, milestoneIndex);
    const receipt = await tx.wait();

    user.rewardsClaimed.push({
      milestoneIndex,
      txHash: receipt.hash,
      claimedAt: new Date(),
    });
    await user.save();

    res.json({ status: "success", txHash: receipt.hash });
  } catch (error) {
    console.error("Claim reward error:", error);
    res.status(500).json({ message: error.message || "Failed to claim reward" });
  }
};
