const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

// Lazily create instance so it reads env at call-time, not at require() time
function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

// Create a Razorpay order
exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1)
      return res.status(400).json({ message: "Minimum top-up is ₹1" });

    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes("XXXX"))
      return res.status(500).json({ message: "Razorpay not configured — add real keys to backend/.env" });

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: amount * 100,   // paise
      currency: "INR",
      receipt: `tp_${String(req.userId).slice(-8)}_${Date.now().toString(36)}`
    });

    res.json({ orderId: order.id, amount, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error("Razorpay order error:", err?.error || err?.message || err);
    res.status(500).json({ message: err?.error?.description || err.message || "Razorpay order failed" });
  }
};

// Verify payment and credit wallet
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = hmac.digest("hex");

    if (digest !== razorpay_signature)
      return res.status(400).json({ message: "Payment verification failed — signature mismatch" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.walletBalance += Number(amount);
    await user.save();

    await Transaction.create({
      userId: user._id,
      amount: Number(amount),
      type: "topup",
      status: "success",
      razorpayOrderId: razorpay_order_id,
      note: "Razorpay top-up"
    });

    res.json({ success: true, newBalance: user.walletBalance });
  } catch (err) {
    console.error("Razorpay verify error:", err);
    res.status(500).json({ message: err.message });
  }
};
