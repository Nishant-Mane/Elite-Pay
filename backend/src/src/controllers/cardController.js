const cardService = require("../services/cardService");

exports.registerCard = async (req, res) => {
  try {
    const { userId, cardUID, label } = req.body;
    if (!userId || !cardUID) {
      return res.status(400).json({ status: "error", message: "userId and cardUID required" });
    }
    const result = await cardService.registerCard(userId, cardUID, label);
    res.json(result);
  } catch (error) {
    console.error("Card register error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

exports.getUserCards = async (req, res) => {
  try {
    const { userId } = req.params;
    const cards = await cardService.getUserCards(userId);
    res.json({ status: "success", cards });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

exports.freezeCard = async (req, res) => {
  try {
    const { cardUID } = req.body;
    const result = await cardService.freezeCard(cardUID);
    res.json(result);
  } catch (error) {
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

exports.unfreezeCard = async (req, res) => {
  try {
    const { cardUID } = req.body;
    const result = await cardService.unfreezeCard(cardUID);
    res.json(result);
  } catch (error) {
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};
