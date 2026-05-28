const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User");
const TopUp = require("../models/TopUp");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Step 1: Create Razorpay order
exports.createOrder = async (userId, amount) => {
  if (!amount || amount <= 0) throw new Error("Invalid amount");

  const order = await razorpay.orders.create({
    amount: amount * 100, // Razorpay takes paise
    currency: "INR",
    receipt: `topup_${userId}_${Date.now()}`,
  });

  const topUp = new TopUp({
    userId,
    amount,
    razorpayOrderId: order.id,
    status: "created",
  });
  await topUp.save();

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  };
};

// Step 2: Verify payment signature and credit wallet
exports.verifyAndCredit = async (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const topUp = await TopUp.findOne({ razorpayOrderId });
  if (!topUp) throw new Error("Order not found");
  if (topUp.status === "paid") throw new Error("Already processed");

  // Verify signature
  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    topUp.status = "failed";
    await topUp.save();
    throw new Error("Payment verification failed");
  }

  // Credit wallet
  const user = await User.findById(topUp.userId);
  if (!user) throw new Error("User not found");

  user.walletBalance += topUp.amount;
  await user.save();

  topUp.razorpayPaymentId = razorpayPaymentId;
  topUp.razorpaySignature = razorpaySignature;
  topUp.status = "paid";
  await topUp.save();

  return { success: true, newBalance: user.walletBalance, amount: topUp.amount };
};
