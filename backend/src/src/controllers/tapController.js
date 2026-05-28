const paymentService = require("../services/paymentService");

// Called by ESP32 on every tap
exports.handleTap = async (req, res) => {
  try {
    const { deviceId, cardUID, amount } = req.body;

    if (!cardUID) return res.status(400).json({ status: "denied", message: "cardUID required" });
    if (!amount) return res.status(400).json({ status: "denied", message: "amount required" });

    const result = await paymentService.processTapPayment(deviceId, cardUID, Number(amount));
    res.json(result);
  } catch (error) {
    console.error("Tap error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

// Called by ESP32 when it reconnects after being offline — replays queued taps
exports.syncOfflineTaps = async (req, res) => {
  try {
    const { deviceId, deviceKey, taps } = req.body;

    if (!Array.isArray(taps) || taps.length === 0) {
      return res.json({ status: "success", processed: 0 });
    }

    const results = [];
    for (const tap of taps) {
      const result = await paymentService.processTapPayment(
        deviceId,
        tap.cardUID,
        Number(tap.amount)
      );
      results.push({ cardUID: tap.cardUID, result });
    }

    res.json({ status: "success", processed: results.length, results });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ status: "error", message: "Sync failed" });
  }
};
