const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");
const merchantAuth = require("../controllers/merchantAuthController");
const tap = require("../controllers/tapController");
const topup = require("../controllers/topupController");
const txn = require("../controllers/transactionController");
const authenticate = require("../middleware/authenticate");

// ─── User Auth ────────────────────────────────────────────────────────────────
router.post("/user/signup",   auth.signup);
router.post("/user/login",    auth.login);
router.get("/user/profile",   authenticate, auth.getProfile);

// ─── Merchant Auth ────────────────────────────────────────────────────────────
router.post("/merchant/signup",  merchantAuth.signup);
router.post("/merchant/login",   merchantAuth.login);
router.get("/merchant/profile",  authenticate, merchantAuth.getProfile);

// ─── RFID Tap (called by ESP32) ───────────────────────────────────────────────
router.post("/tap",       tap.handleTap);         // ESP32 sends cardUID + amount
router.post("/tap/sync",  tap.syncOfflineTaps);   // ESP32 syncs offline queue

// ─── Payment Session (Merchant POS ↔ ESP32) ───────────────────────────────────
// 1. Merchant clicks "Await Tap" → POST /api/tap/await
// 2. ESP32 polls GET /api/tap/pending?deviceId=X
// 3. ESP32 taps card → POST /api/tap (clears session, stores result)
// 4. Website polls GET /api/tap/result?deviceId=X to get outcome
router.post("/tap/await",             authenticate, tap.createPaymentSession);
router.get("/tap/pending",            tap.getPaymentSession);       // ESP32 calls this
router.get("/tap/result",             authenticate, tap.getPaymentResult);  // website polls
router.delete("/tap/pending",         authenticate, tap.cancelPaymentSession);

// ─── Card Registration (User Cards ↔ ESP32) ───────────────────────────────────
// 1. User clicks "Register via NFC Tap" → POST /api/cards/registration-session
// 2. ESP32 taps card → POST /api/cards/register-tap  { cardUID, deviceId }
// 3. Website polls GET /api/cards/registration-result?deviceId=X
router.post("/cards/registration-session",   authenticate, tap.createRegistrationSession);
router.post("/cards/register-tap",           tap.registerCardViaTap);   // ESP32 — no auth
router.get("/cards/registration-result",     authenticate, tap.getRegistrationResult);
router.delete("/cards/registration-session", authenticate, tap.cancelRegistrationSession);

// Manual UID entry (fallback)
router.post("/cards/register",  authenticate, tap.registerCard);
router.get("/cards/mine",       authenticate, tap.getUserCards);

// ─── Razorpay Top-Up ─────────────────────────────────────────────────────────
router.post("/topup/order",   authenticate, topup.createOrder);
router.post("/topup/verify",  authenticate, topup.verifyPayment);

// ─── Transactions ─────────────────────────────────────────────────────────────
router.get("/transactions/user",     authenticate, txn.getUserTransactions);
router.get("/transactions/merchant", authenticate, txn.getMerchantTransactions);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.get("/admin/stats",        txn.getAdminStats);
router.get("/admin/transactions", txn.getAllTransactions);
router.get("/admin/users",        txn.getAllUsers);
router.get("/admin/merchants",    txn.getAllMerchants);

module.exports = router;
