const express = require('express');
const {
    signupController,
    loginController,
    verify2FALoginController,
    refreshTokenRotationController,
    logoutController
} = require('../controller/authController');

const validateZod = require('../middleware/validateZod');
const {
    signupRateLimiter,
    loginRateLimiter,
} = require('../middleware/rateLimitingMiddleware');

const {
    signupSchema,
    loginSchema,
} = require('../validator/authSchema');

const authRoute = express.Router();

// ========================== SIGNUP ==========================
authRoute.post(
    '/signup',
    // signupRateLimiter,
    validateZod(signupSchema),
    signupController
);

// ========================== LOGIN ==========================
authRoute.post(
    '/login',
    // loginRateLimiter,
    validateZod(loginSchema),
    loginController
);

// ========================== VERIFY 2FA LOGIN ==========================
authRoute.post(
    '/login/verify-2fa',
    // loginRateLimiter,
    verify2FALoginController
);

// ========================== REFRESH TOKEN ==========================
authRoute.post(
    '/refresh',
    refreshTokenRotationController
);

// ========================== LOGOUT ==========================
authRoute.post(
    '/logout',
    logoutController
);

module.exports = authRoute;
