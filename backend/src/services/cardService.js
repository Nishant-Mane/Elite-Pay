const Card = require("../models/Card");

exports.registerCard = async (userId, cardUID) => {

    const existingCard = await Card.findOne({ cardUID });

    if (existingCard) {
        return { status: "denied", message: "Card already registered" };
    }

    const card = new Card({
        userId,
        cardUID,
        status: "active"
    });

    await card.save();

    return {
        status: "success",
        message: "Card registered"
    };

};