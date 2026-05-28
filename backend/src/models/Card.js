const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
    cardUID: {
        type: String,
        required: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    status: {
        type: String,
        default: "active"
    }
});

module.exports = mongoose.model("Card", cardSchema);