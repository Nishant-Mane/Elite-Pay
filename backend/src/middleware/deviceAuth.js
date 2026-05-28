module.exports = function deviceAuth(req, res, next) {

    const { deviceId, deviceKey } = req.body;

    if (!deviceId || !deviceKey) {
        return res.status(401).json({
            status: "denied",
            message: "Device credentials missing"
        });
    }

    if (deviceKey !== process.env.DEVICE_SECRET) {
        return res.status(403).json({
            status: "denied",
            message: "Invalid device key"
        });
    }

    next();
};