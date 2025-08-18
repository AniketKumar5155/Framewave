const { User, RefreshToken, AuthLog } = require('../models');
const hashData = require('../utils/hashData');
const verifyData = require('../utils/verifyData');
const generateTokens = require('../utils/generateTokens');
const { send2FAOtpService, verify2FAOtpService } = require('./otpService');
const { Op } = require('sequelize');
const { client: redisClient } = require('../config/redisClient');
const JWT = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

// ========================== SIGNUP ==========================
const signupService = async ({ first_name, last_name, username, email, password, otp }, meta) => {
    const redisKey = `signupOtp:${email}`;
    const storedOtp = await redisClient.get(redisKey);
    if (!storedOtp) throw new Error('OTP expired or not found.');

    const isMatch = await verifyData(otp.toString(), storedOtp.toString());
    if (!isMatch) throw new Error('Invalid OTP.');
    await redisClient.del(redisKey);

    const existingUser = await User.findOne({
        where: { [Op.or]: [{ username }, { email }] }
    });
    if (existingUser) throw new Error('User already exists.');

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
        token: refreshToken.toString(),
        user_id: newUser.id,
        ip_address: meta.ip,
        user_agent: meta.userAgent,
        location: meta.location,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
        is_valid: true,
        last_used: new Date()
    });

    await AuthLog.create({
        user_id: newUser.id,
        action: 'signup',
        location: meta.location,
        ip_address: meta.ip,
        user_agent: meta.userAgent,
    });

    return {
        success: true,
        message: 'Signup successful.',
        user: {
            id: newUser.id,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            username: newUser.username,
            email: newUser.email,
        },
        token: { accessToken: accessToken.toString(), refreshToken: refreshToken.toString() },
    };
};

// ========================== LOGIN ==========================
const loginService = async ({ identifier, password, subject, text, html }, meta) => {
    const user = await User.findOne({
        where: {
            [Op.or]: [{ email: identifier }, { username: identifier }],
        },
    });

    if (!user) throw new Error('User not found.');
    if (user.is_deleted) throw new Error('Account has been deleted.');
    if (user.is_banned) throw new Error('Account is banned.');
    if (!user.is_active) throw new Error('Account is deactivated. Contact support.');

    const isPasswordValid = await verifyData(password.toString(), user.password.toString());
    if (!isPasswordValid) throw new Error('Incorrect password.');

    if (!user.is_2fa_enabled) {
        await send2FAOtpService({
            username: user.username,
            email: user.email,
            subject,
            text,
            html
        });

        return {
            success: false,
            message: 'OTP sent for 2FA. Please verify.',
            requires2FA: true,
            userId: user.id,
            email: user.email,
        };
    }

    return completeLogin(user, meta);
};

// ========================== VERIFY 2FA LOGIN ==========================
const verify2FALoginService = async ({ email, otp }, meta) => {
    await verify2FAOtpService({ email, otp: otp.toString() });

    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error('User not found after OTP verification.');

    return completeLogin(user, meta);
};

// ========================== COMPLETE LOGIN ==========================
const completeLogin = async (user, meta) => {
    const { accessToken, refreshToken } = generateTokens({
        userId: user.id,
        username: user.username,
        email: user.email,
    });

    await RefreshToken.create({
        token: refreshToken.toString(),
        user_id: user.id,
        ip_address: meta.ip,
        user_agent: meta.userAgent,
        location: meta.location,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
        is_valid: true,
        last_used: new Date()
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
        message: 'Login successful.',
        accessToken: accessToken.toString(),
        refreshToken: refreshToken.toString(),
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
        },
    };
};

// ========================== TOKEN ROTATION ==========================
const refreshTokenRotationService = async (oldRefreshToken, meta) => {
    if (!oldRefreshToken) throw new Error(`Refresh token not found`);

    let payload;
    try {
        payload = JWT.verify(oldRefreshToken.toString(), process.env.SECRET_REFRESH_TOKEN);
    } catch (error) {
        console.error(error);
        throw new Error(`Invalid or expired refresh token`);
    }

    const { userId, username, email } = payload;
    const user = await User.findByPk(userId);

    if (!user) throw new Error('User not found');
    if (user.is_deleted) throw new Error('Account has been deleted.');
    if (user.is_banned) throw new Error('Account is banned.');
    if (!user.is_active) throw new Error('Account is deactivated. Contact support.');

    const tokenRecord = await RefreshToken.findOne({
        where: {
            token: oldRefreshToken.toString(),
            user_id: userId,
            is_valid: true,
            revoked_at: null,
            expires_at: { [Op.gt]: new Date() }
        }
    });

    if (!tokenRecord) {
        await RefreshToken.update(
            { is_valid: false, revoked_at: new Date() },
            { where: { user_id: userId, is_valid: true } }
        );

        await sendEmail({
            to: email,
            subject: 'Security Alert: Unusual Activity Detected on Your Account',
            text: `...`,
            html: `...`
        });

        throw new Error('Refresh token reused or revoked. All tokens invalidated.');
    }

    tokenRecord.is_valid = false;
    tokenRecord.revoked_at = new Date();
    tokenRecord.last_used = new Date();
    await tokenRecord.save();

    const { accessToken, refreshToken: newRefreshToken } = generateTokens({ userId, username, email });

    await RefreshToken.create({
        token: newRefreshToken.toString(),
        user_id: userId,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
        is_valid: true,
        ip_address: meta.ip,
        user_agent: meta.userAgent,
        location: meta.location,
        rotated_from: oldRefreshToken.toString(),
        last_used: new Date(),
    });

    await AuthLog.create({
        user_id: userId,
        action: 'refresh_token_rotated',
        ip_address: meta.ip,
        user_agent: meta.userAgent,
        location: meta.location,
    });

    return {
        accessToken: accessToken.toString(),
        refreshToken: newRefreshToken.toString(),
    };
};

// ========================== LOGOUT ==========================
const logoutService = async (refreshToken, meta) => {
    if (!refreshToken) throw new Error('Refresh token is required for logout.');

    const tokenRecord = await RefreshToken.findOne({
        where: { token: refreshToken.toString(), is_valid: true },
    });

    if (!tokenRecord) throw new Error('Refresh token not found or already invalidated.');

    tokenRecord.is_valid = false;
    tokenRecord.revoked_at = new Date();
    await tokenRecord.save();

    await AuthLog.create({
        user_id: tokenRecord.user_id,
        action: 'logout',
        ip_address: meta.ip,
        user_agent: meta.userAgent,
        location: meta.location,
    });

    return {
        success: true,
        message: 'Logout successful. Refresh token invalidated.',
    };
};

module.exports = {
    signupService,
    loginService,
    verify2FALoginService,
    refreshTokenRotationService,
    logoutService,
};
