const { client: redisClient } = require('../config/redisClient');
const generateOtp = require('../utils/generateOtp');
const sendEmail = require('../utils/sendEmail');
const hashData = require('../utils/hashData');
const verifyData = require('../utils/verifyData');
const { User } = require('../models');
const { Op } = require('sequelize');


const sendOtpService = async ({ username, email }) => {
    const existingUser = await User.findOne({
        where: {
            [Op.or]: [{ username }, { email }]
        }
    });

    if (existingUser) {
        throw new Error(`User already exists`);
    }

    const { otp, expiresAt } = generateOtp();
    const ttlInSeconds = Math.floor((expiresAt - Date.now()) / 1000);
    const redisKey = `signupOtp:${email}`;

    const hashedOtp = await hashData(otp);
    await redisClient.set(redisKey, hashedOtp, { EX: ttlInSeconds });

    const subject = 'Verify your email for Instagram Clone signup';
    const text = `Your OTP for verifying your email is: ${otp}`;
    const html = `
        <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #ddd; border-radius: 10px; padding: 30px; background: #fafafa;">
            <h2 style="color: #333;">Welcome to InstaClone, ${username}!</h2>
            <p style="font-size: 16px; color: #555;">To complete your signup, please verify your email address using the OTP below:</p>
            <div style="margin: 20px 0; text-align: center;">
                <span style="font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #2e89ff;">${otp}</span>
            </div>
            <p style="font-size: 14px; color: #999;">This OTP will expire in 10 minutes. If you didn’t try to sign up, you can safely ignore this email.</p>
            <hr style="margin-top: 30px;"/>
            <p style="font-size: 12px; color: #aaa; text-align: center;">InstaClone Security Team</p>
        </div>
    `;

    await sendEmail({ to: email, subject, text, html });
};

const verifyOtpService = async ({ email, otp }) => {
    const redisKey = `signupOtp:${email}`;
    const storedOtp = await redisClient.get(redisKey);

    if (!storedOtp) {
        throw new Error('OTP expired or not found.');
    }

    const isMatch = await verifyData(otp, storedOtp);
    if (!isMatch) {
        throw new Error('Invalid OTP.');
    }

    await redisClient.del(redisKey);
    await redisClient.set(`verified:${email}`, storedOtp, { EX: 600 });

    return {
        success: true,
        message: 'OTP verified successfully.',
    };
};

const send2FAOtpService = async ({ username, email }) => {
    const { otp, expiresAt } = generateOtp();
    const ttlInSeconds = Math.floor((expiresAt - Date.now()) / 1000);
    const redisKey = `otp2FALogin:${email}`;

    const hashedOtp = await hashData(otp);
    await redisClient.set(redisKey, hashedOtp, { EX: ttlInSeconds });

    const subject = 'Your 2FA Login OTP - InstaClone';
    const text = `Hi ${username},

You are trying to log in to your InstaClone account. Use the following OTP to continue:

${otp}

This OTP will expire in 10 minutes. If you did not request this, please secure your account.

- InstaClone Security Team`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 24px;">
            <h2 style="color: #333;">Two-Factor Authentication</h2>
            <p>Hi <strong>${username}</strong>,</p>
            <p>You are trying to log in to your <strong>InstaClone</strong> account. Use the OTP below to verify your identity:</p>
            <div style="font-size: 24px; font-weight: bold; margin: 16px 0; color: #2c3e50;">${otp}</div>
            <p>This code is valid for 10 minutes.</p>
            <p>If you didn’t attempt to log in, please reset your password immediately or contact support.</p>
            <hr style="margin: 24px 0;">
            <p style="font-size: 12px; color: #888;">This is an automated message from InstaClone Security Team.</p>
        </div>
    `;

    await sendEmail({ to: email, subject, text, html });
};


const verify2FAOtpService = async ({ email, otp }) => {
    try {
        const redisKey = `otp2FALogin:${email}`;
        const storedOtp = await redisClient.get(redisKey);

        if (!storedOtp) {
            throw new Error('OTP expired or not found.');
        }

        const isMatch = await verifyData(otp, storedOtp);
        if (!isMatch) {
            throw new Error('Invalid OTP');
        }

        await redisClient.del(redisKey);
        await redisClient.set(`verifiedOtp2FALogin:${email}`, 'true', { EX: 600 });

        return {
            success: true,
            message: '2FA OTP verified successfully.',
        };
    } catch (error) {
        console.log(error)
        throw new Error(`Invalid otp`)
    }
};

// const resendOtpService = async ({username, email, otpType }) => {

// let attempt = 0;

// const validType  ={
// signupOtp: `Hello ${username}, your ${otp} for signup`,
// login2FAOtp: `Hello ${username}, your ${otp} for 2FA login`
// }

// if(!otpType.include(validType)){
// throw new Error(`Invalid otpType`)
// }

// const { otp, expiresAt } = generateOtp();
// const hashedotp = hashData(otp);
// const ttlInSeconds = Math.floor((expiresAt - Date.now())/1000);

// const redisKey = `resend${otpType}:${email}`

// await redisClient.set(redisKey, hashedotp, { EX: ttlInSeconds })
// await redisClient.set(`resendOtpAttempt${email}`, attempt++, { EX: 600})
// }

const sendOtpForPasswordReset = async ({ username, email }) => {
    try {
        const user = await User.findOne({
            where: {
                [Op.or]: [{ username }, { email }]
            }
        })
        if(!user) return {
            success: false,
            message: `User not found`
        }
        const { otp, expiresAt } = generateOtp();
        const ttlInSeconds = Math.floor((expiresAt - Date.now()) / 1000);
        const redisKey = `passwordReset:${email}`;
        const hashedOtp = await hashData(otp);
        await redisClient.set(redisKey, hashedOtp, { EX: ttlInSeconds });

        const subject = `OTP for password reset`
        const text = `Your otp is ${otp}`

        await sendEmail({ to: email, subject, text })
    } catch (error) {
        console.log(error)
        throw new Error(`ERROR FIX THE ERROR PLEASE FIX THE ERROR ERROR ERROR ERROR ERROR ERROR ERROR ERROR ERROR ERROR ERROR ERROR ERROR ERROR ERROR`)
    }
}

const verifyOtpForPasswordReset = async ({ email, otp }) =>{
    
}

module.exports = {
    sendOtpService,
    verifyOtpService,
    send2FAOtpService,
    verify2FAOtpService,
    // resendOtpService,
    sendOtpForPasswordReset,
};
