const express = require("express");
const router = express.Router();
const deviceAuth = require("../middleware/deviceAuth");
const portalAuth = require("../middleware/portalAuth");

const tapController = require("../controllers/tapController");
const cardController = require("../controllers/cardController");
const userController = require("../controllers/userController");
const topUpController = require("../controllers/topUpController");
const merchantController = require("../controllers/merchantController");
const adminController = require("../controllers/adminController");

// ── ESP32 routes (device auth) ──────────────────────────────
router.post("/tap", deviceAuth, tapController.handleTap);
router.post("/tap/sync", deviceAuth, tapController.syncOfflineTaps);

// ── User routes ─────────────────────────────────────────────
router.post("/user/sync", portalAuth("user"), userController.syncUser);
router.get("/user/profile", portalAuth("user"), userController.getProfile);
router.get("/user/transactions", portalAuth("user"), userController.getTransactions);
router.post("/user/wallet-address", portalAuth("user"), userController.saveWalletAddress);
router.post("/user/claim-reward", portalAuth("user"), userController.claimReward);
router.post("/user/topup/order", portalAuth("user"), topUpController.createOrder);
router.post("/user/topup/verify", portalAuth("user"), topUpController.verifyPayment);

// ── Card routes ─────────────────────────────────────────────
router.post("/cards/register", portalAuth("user"), cardController.registerCard);
router.get("/cards/:userId", portalAuth("user"), cardController.getUserCards);
router.post("/cards/freeze", portalAuth("user"), cardController.freezeCard);
router.post("/cards/unfreeze", portalAuth("user"), cardController.unfreezeCard);

// ── Merchant routes ─────────────────────────────────────────
router.post("/merchant/sync", portalAuth("merchant"), merchantController.syncMerchant);
router.get("/merchant/profile", portalAuth("merchant"), merchantController.getProfile);
router.get("/merchant/transactions", portalAuth("merchant"), merchantController.getTransactions);
router.post("/merchant/payment-request", portalAuth("merchant"), merchantController.createPaymentRequest);

// ── Admin routes ────────────────────────────────────────────
router.get("/admin/users", portalAuth("admin"), adminController.getAllUsers);
router.get("/admin/merchants", portalAuth("admin"), adminController.getAllMerchants);
router.get("/admin/transactions", portalAuth("admin"), adminController.getAllTransactions);
router.get("/admin/stats", portalAuth("admin"), adminController.getSystemStats);
router.patch("/admin/users/:userId/freeze", portalAuth("admin"), adminController.freezeUser);
router.patch("/admin/users/:userId/unfreeze", portalAuth("admin"), adminController.unfreezeUser);
router.post("/admin/cards/freeze", portalAuth("admin"), adminController.freezeCard);
router.patch("/admin/transactions/:transactionId/reverse", portalAuth("admin"), adminController.reverseTransaction);

module.exports = router;
