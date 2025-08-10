const { User, RefreshToken, AuthLog } = require('../models');
const hashData = require('../utils/hashData');
const verifyData = require('../utils/verifyData');
const generateTokens = require('../utils/generateTokens');
const { send2FAOtpService, verify2FAOtpService, verifyOtpService } = require('./otpService');
const { Op } = require('sequelize');
const { client: redisClient } = require('../config/redisClient');

const signupService = async ({ first_name, last_name, username, email, password, otp }, meta) => {
    const storedOtp = await redisClient.get(`verified:${email}`);
    const isVerified = await verifyData(otp, storedOtp)
    if (!isVerified) throw new Error(`Invalid otp`)
    await redisClient.del(`verified:${email}`)

    const existingUser = await User.findOne({
        where: { [Op.or]: [{ username }, { email }] }
    });
    if (existingUser) throw new Error(`User already exists`);

    const hashedPassword = await hashData(password);

    const newUser = await User.create({
        first_name,
        last_name,
        username,
        email,
        password: hashedPassword,
    });

    const { accessToken, refreshToken } = generateTokens({
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
    });

    await RefreshToken.create({
        token: refreshToken,
        user_id: newUser.id,
        ip: meta.ip,
        user_agent: meta.userAgent,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await AuthLog.create({
        user_id: newUser.id,
        action: 'signup',
        location: meta.location,
        ip_address: meta.ip,
        user_agent: meta.userAgent,
    });

    return {
        user: {
            id: newUser.id,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            username: newUser.username,
            email: newUser.email,
        },
        token: { accessToken, refreshToken }
    };
};

const loginService = async ({ identifier, password, subject, text, html }, meta) => {
    const user = await User.findOne({
        where: {
            [Op.or]: [{ email: identifier }, { username: identifier }],
        },
    });

    if (!user) throw new Error("User not found");
    if (user.is_deleted) throw new Error("Account has been deleted");
    if (user.is_banned) throw new Error("Account is banned");
    if (!user.is_active) throw new Error("Account is deactivated. Contact support.");

    const isPasswordValid = await verifyData(password, user.password);
    if (!isPasswordValid) throw new Error("Incorrect password");

    if (user.is_2fa_enabled) {
        await send2FAOtpService({
            username: user.username,
            email: user.email,
            subject,
            text,
            html
        });

        return {
            success: false,
            message: "OTP sent for 2FA. Please verify.",
            requires2FA: true,
            userId: user.id,
            email: user.email
        };
    }

    return await completeLogin(user, meta);
};

const verify2FALoginService = async ({ email, otp }, meta) => {
    await verify2FAOtpService({ email, otp });

    const user = await User.findOne({ where: { email } });
    console.log(`user: ${user}`)
    if (!user) throw new Error("User not found after OTP verification");
    return await completeLogin(user, meta);
};

const completeLogin = async (user, meta) => {
    const { accessToken, refreshToken } = generateTokens({
        userId: user.id,
        username: user.username,
        email: user.email,
    });

    await RefreshToken.create({
        token: refreshToken,
        user_id: user.id,
        ip: meta.ip,
        user_agent: meta.userAgent,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await AuthLog.create({
        user_id: user.id,
        action: 'login',
        location: meta.location,
        ip_address: meta.ip,
        user_agent: meta.userAgent,
    });

    return {
        success: true,
        message: "Login successful.",
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
        },
    };
};

module.exports = {
    signupService,
    loginService,
    verify2FALoginService
};
