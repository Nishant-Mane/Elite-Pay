const Merchant = require("../models/Merchant");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "elitepay_secret_dev";

exports.signup = async (req, res) => {
  try {
    const { name, email, password, businessName } = req.body;
    if (!name || !email || !password || !businessName)
      return res.status(400).json({ message: "All fields required" });

    const exists = await Merchant.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const merchant = await Merchant.create({ name, email, password, businessName });
    const token = jwt.sign({ id: merchant._id, role: "merchant" }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      token,
      merchant: { id: merchant._id, name: merchant.name, email: merchant.email, businessName: merchant.businessName }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const merchant = await Merchant.findOne({ email });
    if (!merchant) return res.status(401).json({ message: "Invalid credentials" });

    const match = await merchant.comparePassword(password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: merchant._id, role: "merchant" }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      token,
      merchant: { id: merchant._id, name: merchant.name, email: merchant.email, businessName: merchant.businessName }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const merchant = await Merchant.findById(req.userId).select("-password");
    if (!merchant) return res.status(404).json({ message: "Merchant not found" });
    res.json(merchant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
