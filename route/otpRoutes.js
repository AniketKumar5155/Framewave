const express = require('express');
const {
    sendOtpController,
    verifyOtpController,
    send2FAOtpController,
    verify2FAOtpController,
} = require('../controller/otpController');
const { otpRateLimiter } = require('../middleware/rateLimitingMiddleware');

const otpRoute = express.Router();

// Generic OTP 
otpRoute.post(
    '/send-otp',
    // otpRateLimiter,
    sendOtpController
);
otpRoute.post(
    '/verify-otp',
    // otpRateLimiter,
    verifyOtpController
);

// 2FA-specific OTP 
otpRoute.post(
    '/send-2fa-otp',
    // otpRateLimiter,
    send2FAOtpController
);
otpRoute.post(
    '/verify-2fa-otp',
    // otpRateLimiter,
    verify2FAOtpController
);

module.exports = otpRoute;
