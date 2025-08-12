const express = require('express');
const {
    sendOtpController,
    send2FAOtpController,
    verify2FAOtpController,
    sendOtpForPasswordResetController,
} = require('../controller/otpController');
const { otpRateLimiter } = require('../middleware/rateLimitingMiddleware');
const { verify2FALoginController } = require('../controller/authController');
const authMiddleware = require('../middleware/authMiddleware');

const otpRoute = express.Router();

// Generic OTP 
otpRoute.post(
    '/send-otp',
    // otpRateLimiter,
    sendOtpController
);

// 2FA-specific OTP 
otpRoute.post(
    '/send-2fa-otp',
    // otpRateLimiter,
    send2FAOtpController
);

otpRoute.post(
    `/verify-2fa-otp`,
    //otpRateLimiter,
    verify2FAOtpController
)

// Password-reset OTP
otpRoute.post(
    '/send-password-reset-otp',
    // otpRateLimiter,
    authMiddleware,
    sendOtpForPasswordResetController
)

module.exports = otpRoute;
    