const topUpService = require("../services/topUpService");
const User = require("../models/User");

// Step 1 — merchant enters amount, creates Razorpay order
exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const supabaseId = req.user.sub;

    const user = await User.findOne({ supabaseId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const order = await topUpService.createOrder(user._id, Number(amount));
    res.json(order);
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: error.message || "Failed to create order" });
  }
};

// Step 2 — Razorpay callback after payment, verify + credit wallet
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const result = await topUpService.verifyAndCredit(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    res.json(result);
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(400).json({ message: error.message || "Payment verification failed" });
  }
};
