const Card = require("../models/Card");

exports.registerCard = async (req, res) => {
    try {

        const { userId, cardUID } = req.body;

        const existingCard = await Card.findOne({ cardUID });

        if (existingCard) {
            return res.json({
                status: "denied",
                message: "Card already registered"
            });
        }

        const card = new Card({
            userId,
            cardUID,
            status: "active"
        });

        await card.save();

        res.json({
            status: "success",
            message: "Card registered successfully"
        });

    } catch (error) {

        console.error("Card registration error:", error);

        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });

    }
};