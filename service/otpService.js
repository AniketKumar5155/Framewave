const { client: redisClient } = require('../config/redisClient');
const generateOtp = require('../utils/generateOtp');
const sendEmail = require('../utils/sendEmail');
const hashData = require('../utils/hashData');
const verifyData = require('../utils/verifyData');
const { User } = require('../models');
const { Op } = require('sequelize');

// ========================== SIGNUP OTP ==========================
const sendOtpService = async ({ username, email }) => {
    if (!username || !email) throw new Error("Username and email are required");

    const existingUser = await User.findOne({
        where: { [Op.or]: [{ username }, { email }] }
    });
    if (existingUser) throw new Error(`User already exists`);

    const { otp, expiresAt } = generateOtp();
    const ttlInSeconds = Math.floor((expiresAt - Date.now()) / 1000);
    const redisKey = `signupOtp:${email}`;
    const hashedOtp = await hashData(otp);

    await redisClient.set(redisKey, hashedOtp, { EX: ttlInSeconds });

    const subject = 'Verify your email for Instagram Clone signup';
    const text = `Your OTP for verifying your email is: ${otp}`;
    const html = `<p>Your OTP is <b>${otp}</b>. It will expire in 10 minutes.</p>`;

    await sendEmail({ to: email, subject, text, html });

    return {
        success: true,
        message: 'Signup OTP sent successfully.'
    };
}

// ========================== 2FA LOGIN OTP ==========================
const send2FAOtpService = async ({ username, email }) => {
    const { otp, expiresAt } = generateOtp();
    const ttlInSeconds = Math.floor((expiresAt - Date.now()) / 1000);
    const redisKey = `otp2FALogin:${email}`;
    const hashedOtp = await hashData(otp);

    await redisClient.set(redisKey, hashedOtp, { EX: ttlInSeconds });

    const subject = 'Your 2FA Login OTP - InstaClone';
    const text = `Hi ${username}, your OTP is ${otp}`;
    const html = `<p>Hi ${username}, your OTP is <b>${otp}</b></p>`;

    await sendEmail({ to: email, subject, text, html });

    return {
        success: true,
        message: '2FA OTP sent successfully.'
    };
};

const verify2FAOtpService = async ({ email, otp }) => {
    const redisKey = `otp2FALogin:${email}`;
    const storedOtp = await redisClient.get(redisKey);
    if (!storedOtp) throw new Error('OTP expired or not found.');

    const isMatch = await verifyData(otp, storedOtp);
    if (!isMatch) throw new Error('Invalid OTP');

    await redisClient.del(redisKey);
    await redisClient.set(`verifiedOtp2FALogin:${email}`, 'true', { EX: 600 });

    return {
        success: true,
        message: '2FA OTP verified successfully.'
    };
};

// ---------- PASSWORD RESET OTP ----------
const sendOtpForPasswordReset = async ({ email }) => {
    const user = await User.findOne({
        where: { email }
    });
    if (!user) throw new Error('User not found');

    const { otp, expiresAt } = generateOtp();
    const ttlInSeconds = Math.floor((expiresAt - Date.now()) / 1000);
    const redisKey = `passwordReset:${email}`;
    const hashedOtp = await hashData(otp);

    await redisClient.set(redisKey, hashedOtp, { EX: ttlInSeconds });

    const subject = 'Password Reset Request - InstaClone';
    const text = `Your password reset OTP is: ${otp}`;

    await sendEmail({ to: email, subject, text, html: `<p>${text}</p>` });

    return {
        success: true,
        message: 'Password reset OTP sent successfully.'
    };
};

module.exports = {
    sendOtpService,
    send2FAOtpService,
    verify2FAOtpService,
    sendOtpForPasswordReset,
};
