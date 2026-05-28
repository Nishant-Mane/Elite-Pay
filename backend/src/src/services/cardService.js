const Card = require("../models/Card");
const User = require("../models/User");

exports.registerCard = async (userId, cardUID, label) => {
  const existingCard = await Card.findOne({ cardUID });
  if (existingCard) return { status: "denied", message: "Card already registered" };

  const user = await User.findById(userId);
  if (!user) return { status: "denied", message: "User not found" };

  const card = new Card({ cardUID, userId, label: label || "My Card", status: "active" });
  await card.save();

  return { status: "success", message: "Card registered", card };
};

exports.getUserCards = async (userId) => {
  return await Card.find({ userId });
};

exports.freezeCard = async (cardUID) => {
  const card = await Card.findOne({ cardUID });
  if (!card) return { status: "error", message: "Card not found" };
  card.status = "frozen";
  await card.save();
  return { status: "success", message: "Card frozen" };
};

exports.unfreezeCard = async (cardUID) => {
  const card = await Card.findOne({ cardUID });
  if (!card) return { status: "error", message: "Card not found" };
  card.status = "active";
  await card.save();
  return { status: "success", message: "Card unfrozen" };
};
