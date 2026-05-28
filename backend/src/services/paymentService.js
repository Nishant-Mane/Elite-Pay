const User = require("../models/User");
const Card = require("../models/Card");
const Transaction = require("../models/Transaction");

const TAP_AMOUNT = 100;

exports.processTapPayment = async (deviceId, cardUID) => {

    const card = await Card.findOne({ cardUID });

    if (!card) {
        return { status: "denied", message: "Card not registered" };
    }

    const user = await User.findById(card.userId);

    if (!user) {
        return { status: "denied", message: "User not found" };
    }

    if (user.walletBalance < TAP_AMOUNT) {
        return { status: "denied", message: "Insufficient balance" };
    }

    user.walletBalance -= TAP_AMOUNT;
    user.totalTransactions += 1;

    await user.save();

    const transaction = new Transaction({
        deviceId,
        cardUID,
        userId: user._id,
        amount: TAP_AMOUNT,
        status: "success"
    });

    await transaction.save();

    return {
        status: "approved",
        balance: user.walletBalance,
        nftMinted: false
    };

};