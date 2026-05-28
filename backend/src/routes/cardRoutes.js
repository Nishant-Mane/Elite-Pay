const express = require("express");
const router = express.Router();

const cardController = require("../controllers/cardController");

router.post("/register", cardController.registerCard);

module.exports = router;