const User = require("../models/User");
const Card = require("../models/Card");
const Transaction = require("../models/Transaction");
const Merchant = require("../models/Merchant");

// ════════════════════════════════════════════════════════════════
//  IN-MEMORY STORES  (reset on server restart — fine for dev)
// ════════════════════════════════════════════════════════════════

// Payment sessions — merchant sets amount, ESP32 picks it up & pays
// Map<deviceId, { amount, merchantId, createdAt, result? }>
const paymentSessions = new Map();

// Registration sessions — user initiates, ESP32 taps & registers
// Map<deviceId, { userId, createdAt, cardUID? }>
const registrationSessions = new Map();

const SESSION_TTL = 2 * 60 * 1000; // 2 minutes

// ════════════════════════════════════════════════════════════════
//  PAYMENT SESSION  (Merchant POS flow)
// ════════════════════════════════════════════════════════════════

// Merchant clicks "Await Tap"
// POST /api/tap/await  { amount, merchantId, deviceId }
exports.createPaymentSession = async (req, res) => {
  try {
    const { amount, merchantId, deviceId } = req.body;
    if (!amount || !deviceId)
      return res.status(400).json({ message: "amount and deviceId required" });
    if (isNaN(amount) || Number(amount) < 1)
      return res.status(400).json({ message: "Invalid amount" });

    paymentSessions.set(deviceId, {
      amount: Number(amount),
      merchantId: merchantId || null,
      createdAt: Date.now(),
      result: null
    });
    console.log(`[PAY] Session created — device:${deviceId} amount:${amount}`);
    res.json({ status: "awaiting", deviceId, amount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ESP32 polls — GET /api/tap/pending?deviceId=POS_001
// Returns { pending: true, amount } if a session exists, else { pending: false }
exports.getPaymentSession = (req, res) => {
  const { deviceId } = req.query;
  if (!deviceId) return res.status(400).json({ message: "deviceId required" });

  const s = paymentSessions.get(deviceId);
  if (!s) return res.json({ pending: false });
  if (Date.now() - s.createdAt > SESSION_TTL) {
    paymentSessions.delete(deviceId);
    return res.json({ pending: false });
  }
  res.json({ pending: true, amount: s.amount });
};

// Website polls for result — GET /api/tap/result?deviceId=POS_001
// Returns { ready: false } until ESP32 has tapped, then { ready: true, ...result }
exports.getPaymentResult = (req, res) => {
  const { deviceId } = req.query;
  if (!deviceId) return res.status(400).json({ message: "deviceId required" });

  const s = paymentSessions.get(deviceId);
  if (!s) return res.json({ ready: false });

  // Session expired without a tap
  if (Date.now() - s.createdAt > SESSION_TTL && !s.result) {
    paymentSessions.delete(deviceId);
    return res.json({ ready: true, status: "expired", message: "Tap timed out" });
  }

  if (!s.result) return res.json({ ready: false });

  // Result is ready — return and clear session
  const result = s.result;
  paymentSessions.delete(deviceId);
  return res.json({ ready: true, ...result });
};

// Merchant cancels — DELETE /api/tap/pending?deviceId=POS_001
exports.cancelPaymentSession = (req, res) => {
  const { deviceId } = req.query;
  paymentSessions.delete(deviceId);
  res.json({ status: "cancelled" });
};

// ════════════════════════════════════════════════════════════════
//  RFID TAP PAYMENT  (called by ESP32)
//  POST /api/tap  { deviceId, deviceKey, cardUID, amount }
// ════════════════════════════════════════════════════════════════
exports.handleTap = async (req, res) => {
  try {
    const { cardUID, amount, deviceId } = req.body;

    if (!cardUID || !amount)
      return res.status(400).json({ status: "error", message: "cardUID and amount required" });

    // Resolve merchantId from session
    const session = paymentSessions.get(deviceId);
    const merchantId = session?.merchantId || req.body.merchantId || null;

    const card = await Card.findOne({ cardUID, status: "active" });
    if (!card) {
      const result = { status: "denied", message: "Card not registered or inactive" };
      if (session) session.result = result;
      return res.json(result);
    }

    const user = await User.findById(card.userId);
    if (!user) {
      const result = { status: "denied", message: "User not found" };
      if (session) session.result = result;
      return res.json(result);
    }

    if (user.walletBalance < amount) {
      const result = { status: "denied", message: "Insufficient balance" };
      if (session) session.result = result;
      return res.json(result);
    }

    // Deduct wallet
    user.walletBalance -= amount;
    user.totalTransactions += 1;
    user.totalSpentINR += amount;

    if (user.totalSpentINR >= 10000)      user.rewardTier = "Platinum";
    else if (user.totalSpentINR >= 5000)  user.rewardTier = "Gold";
    else if (user.totalSpentINR >= 1000)  user.rewardTier = "Silver";
    else                                   user.rewardTier = "Bronze";

    await user.save();

    if (merchantId) {
      await Merchant.findByIdAndUpdate(merchantId, {
        $inc: { totalCollected: amount, totalTransactions: 1 }
      });
    }

    const transaction = await Transaction.create({
      userId: user._id,
      merchantId: merchantId || null,
      cardUID,
      deviceId: deviceId || "pos",
      amount,
      type: "payment",
      status: "success"
    });

    const result = {
      status: "approved",
      userName: user.name,
      balance: user.walletBalance,
      transactionId: transaction._id,
      amount
    };

    // Store result in session so website poll picks it up
    if (session) session.result = result;

    console.log(`[PAY] Approved — user:${user.name} amount:${amount} cardUID:${cardUID}`);
    return res.json(result);

  } catch (err) {
    console.error("Tap error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

// ════════════════════════════════════════════════════════════════
//  REGISTRATION SESSION  (User Cards flow)
// ════════════════════════════════════════════════════════════════

// User clicks "Register via NFC Tap" on website
// POST /api/cards/registration-session  { userId, deviceId }
// Creates a session the ESP32 will fulfill by tapping a card
exports.createRegistrationSession = async (req, res) => {
  try {
    const { userId, deviceId } = req.body;
    if (!userId || !deviceId)
      return res.status(400).json({ message: "userId and deviceId required" });

    registrationSessions.set(deviceId, { userId, createdAt: Date.now(), cardUID: null });
    console.log(`[REG] Session created — device:${deviceId} user:${userId}`);
    res.json({ status: "waiting", deviceId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Website polls — GET /api/cards/registration-result?deviceId=POS_001
// Returns { ready: false } until card tapped, then { ready: true, card }
exports.getRegistrationResult = (req, res) => {
  const { deviceId } = req.query;
  if (!deviceId) return res.status(400).json({ message: "deviceId required" });

  const s = registrationSessions.get(deviceId);
  if (!s) return res.json({ ready: false });

  if (Date.now() - s.createdAt > SESSION_TTL && !s.cardUID) {
    registrationSessions.delete(deviceId);
    return res.json({ ready: true, status: "expired", message: "Tap timed out" });
  }

  if (!s.cardUID) return res.json({ ready: false });

  const result = { ready: true, status: "registered", cardUID: s.cardUID };
  registrationSessions.delete(deviceId);
  return res.json(result);
};

// User cancels — DELETE /api/cards/registration-session?deviceId=POS_001
exports.cancelRegistrationSession = (req, res) => {
  const { deviceId } = req.query;
  registrationSessions.delete(deviceId);
  res.json({ status: "cancelled" });
};

// ════════════════════════════════════════════════════════════════
//  CARD REGISTRATION — called by ESP32 on tap
//  POST /api/cards/register-tap  { cardUID, deviceId }
//
//  ESP32 does NOT need to know userId.
//  Backend looks up the active registration session for this device.
// ════════════════════════════════════════════════════════════════
exports.registerCardViaTap = async (req, res) => {
  try {
    const { cardUID, deviceId } = req.body;
    if (!cardUID) return res.status(400).json({ message: "cardUID required" });

    console.log(`[REG] Tap received — cardUID:${cardUID} device:${deviceId}`);

    // Look up active registration session
    const session = registrationSessions.get(deviceId);
    if (!session) {
      // No session — just print UID and return (no registration)
      return res.json({ status: "no_session", cardUID, message: "No active registration session for this device" });
    }

    if (Date.now() - session.createdAt > SESSION_TTL) {
      registrationSessions.delete(deviceId);
      return res.json({ status: "expired", cardUID, message: "Registration session expired" });
    }

    const { userId } = session;

    // Check duplicates
    const exists = await Card.findOne({ cardUID });
    if (exists) {
      session.cardUID = cardUID; // mark session done so website can show the message
      return res.status(409).json({ status: "duplicate", cardUID, message: "Card already registered" });
    }

    const card = await Card.create({ cardUID, userId, status: "active" });
    session.cardUID = cardUID; // signal to the website poll

    console.log(`[REG] Card ${cardUID} registered to user ${userId}`);
    res.status(201).json({ status: "registered", cardUID, card });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ════════════════════════════════════════════════════════════════
//  MANUAL CARD REGISTRATION  (website, user types UID)
//  POST /api/cards/register  { userId, cardUID }
// ════════════════════════════════════════════════════════════════
exports.registerCard = async (req, res) => {
  try {
    const { userId, cardUID } = req.body;
    const exists = await Card.findOne({ cardUID });
    if (exists) return res.status(409).json({ message: "Card already registered" });
    const card = await Card.create({ cardUID, userId, status: "active" });
    res.status(201).json({ message: "Card registered", card });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ════════════════════════════════════════════════════════════════
//  GET USER CARDS
// ════════════════════════════════════════════════════════════════
exports.getUserCards = async (req, res) => {
  try {
    const cards = await Card.find({ userId: req.userId });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ════════════════════════════════════════════════════════════════
//  OFFLINE SYNC  (ESP32 syncs queued taps when back online)
//  POST /api/tap/sync  { deviceId, taps: [{ cardUID, amount }] }
// ════════════════════════════════════════════════════════════════
exports.syncOfflineTaps = async (req, res) => {
  try {
    const { taps, deviceId } = req.body;
    if (!Array.isArray(taps)) return res.status(400).json({ message: "taps array required" });

    let processed = 0;
    for (const tap of taps) {
      const { cardUID, amount } = tap;
      const card = await Card.findOne({ cardUID, status: "active" });
      if (!card) continue;
      const user = await User.findById(card.userId);
      if (!user || user.walletBalance < amount) continue;

      user.walletBalance -= amount;
      user.totalTransactions += 1;
      user.totalSpentINR += amount;
      await user.save();

      await Transaction.create({
        userId: user._id,
        cardUID,
        deviceId: deviceId || "pos",
        amount,
        type: "payment",
        status: "success"
      });
      processed++;
    }
    res.json({ status: "ok", processed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};