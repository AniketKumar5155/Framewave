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
    const isMatch = await verifyData(otp, storedOtp);
    if (!isMatch) throw new Error('Invalid OTP.');
    await redisClient.del(redisKey);

    const existingUser = await User.findOne({
        where: { [Op.or]: [{ username }, { email }] }
    });
    if (existingUser) {
        throw new Error('User already exists.');
    }

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

    // const hashedRefreshToken = await hashData(refreshToken);

    await RefreshToken.create({
        token: refreshToken,
        user_id: newUser.id,
        ip_address: meta.ip,
        user_agent: meta.userAgent,
        location: meta.location,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
        is_valid: true,
        last_used: new Date(Date.now())
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
        token: { accessToken, refreshToken },
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

    const isPasswordValid = await verifyData(password, user.password);
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
    await verify2FAOtpService({ email, otp });

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

    // const hashedRefreshToken = await hashData(refreshToken);

    await RefreshToken.create({
        token: refreshToken,
        user_id: user.id,
        ip_address: meta.ip,
        user_agent: meta.userAgent,
        location: meta.location,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
        is_valid: true,
        last_used: new Date(Date.now())
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
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
        },
    };
};

// ========================== TOKEN ROTATION ==========================

const refreshTokenRotationService = async (oldRefreshToken, meta) => {
    if (!oldRefreshToken) {
        throw new Error(`Refresh token not found`);
    }

    // console.log('Using secret:', process.env.SECRET_REFRESH_TOKEN);
    // console.log('Old Refresh Token:', oldRefreshToken);


    let payload;
    try {
        payload = JWT.verify(oldRefreshToken, process.env.SECRET_REFRESH_TOKEN);
    } catch (error) {
        console.error(error);
        throw new Error(`Invalid or expired refresh token`);
    }

    console.log('Using secret:', process.env.SECRET_REFRESH_TOKEN);
    console.log('Old Refresh Token:', oldRefreshToken);
    const { userId, username, email } = payload;
    const user = await User.findByPk(userId);

    if (!user) throw new Error('User not found');
    if (user.is_deleted) throw new Error('Account has been deleted.');
    if (user.is_banned) throw new Error('Account is banned.');
    if (!user.is_active) throw new Error('Account is deactivated. Contact support.');


    // const hashedOldRefreshToken = await hashData(oldRefreshToken);

    const tokenRecord = await RefreshToken.findOne({
        where: {
            token: oldRefreshToken,
            user_id: userId,
            is_valid: true,
            revoked_at: null,
            expires_at: { [Op.gt]: new Date() }
        }
    });


    // Consider removing logic and prevent mass logout
    if (!tokenRecord) {
        // Possible token reuse or token revoked
        // Revoke all tokens for this user for security
        await RefreshToken.update(
            { is_valid: false, revoked_at: new Date() },
            {
                where: {
                    user_id: userId,
                    is_valid: true,
                }
            }
        );

        await sendEmail({
            to: email,
            subject: 'Security Alert: Unusual Activity Detected on Your Account',
            text: `
Hello,

We detected unusual activity with your account's refresh token, which may indicate unauthorized access attempts.

For your protection, all active sessions have been logged out and tokens invalidated.

What you need to do:
- Log in again with your credentials.
- Reset your password if you suspect it was compromised.
- Enable 2FA for extra security.
- Contact support if you did not initiate this activity.

Thank you,
InstaClone Security Team
            `,
            html: `
<p>Hello,</p>
<p>We detected <strong>unusual activity</strong> with your account's refresh token, which may indicate unauthorized access attempts.</p>
<p>For your protection, all active sessions have been logged out and tokens invalidated.</p>
<h4>What you need to do:</h4>
<ul>
  <li>Log in again with your credentials.</li>
  <li>Reset your password if you suspect it was compromised.</li>
  <li>Enable 2FA for extra security.</li>
  <li>Contact support if you did not initiate this activity.</li>
</ul>
<p>Thank you,<br/>InstaClone Security Team</p>
            `
        });

        throw new Error('Refresh token reused or revoked. All tokens invalidated.');
    }

    tokenRecord.is_valid = false;
    tokenRecord.revoked_at = new Date();
    tokenRecord.last_used = new Date();
    await tokenRecord.save();

    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
        userId,
        username,
        email,
    });

    // const hashedNewRefreshToken = await hashData(newRefreshToken);

    await RefreshToken.create({
        token: newRefreshToken,
        user_id: userId,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
        is_valid: true,
        ip_address: meta.ip,
        user_agent: meta.userAgent,
        location: meta.location,
        rotated_from: oldRefreshToken,
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
        accessToken,
        refreshToken: newRefreshToken,
    };
};

module.exports = {
    signupService,
    loginService,
    verify2FALoginService,
    refreshTokenRotationService,
};