const {
    sendOtpService,
    send2FAOtpService,
    verify2FAOtpService,
    sendOtpForPasswordReset,
} = require('../service/otpService');
const { User } = require('../models');
const { Op } = require('sequelize');

const sendOtpController = async (req, res) => {
    try {
        const { email } = req.body;
        await sendOtpService({ email });
        res.status(200).json({ 
            success: true,
            message: 'OTP sent successfully' 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
};

const send2FAOtpController = async (req, res) => {
    try {
        const { identifier } = req.body;
        const user = await User.findOne({
            where: { [Op.or]: [{ username: identifier }, { email: identifier }] }
        });

        if (!user) throw new Error('User not found');

        await send2FAOtpService({ username: user.username, email: user.email });
        res.status(200).json({ message: '2FA OTP sent successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


const verify2FAOtpController = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const result = await verify2FAOtpService({ email, otp });
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const sendOtpForPasswordResetController = async (req, res) => {
    try {
        const { email } = req.body;
        await sendOtpForPasswordReset({ email });
        res.status(200).json({ message: 'Password reset OTP sent successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    sendOtpController,
    send2FAOtpController,
    verify2FAOtpController,
    sendOtpForPasswordResetController,
};
