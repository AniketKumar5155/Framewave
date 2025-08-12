const express = require('express');
const {
    signupController,
    loginController,
    verify2FALoginController,
    refreshTokenRotationController
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

authRoute.post(
    '/signup',
    // signupRateLimiter,
    validateZod(signupSchema),
    signupController
);

authRoute.post(
    '/login',
    // loginRateLimiter,
    validateZod(loginSchema),
    loginController
);

authRoute.post(
    '/login/verify-2fa',
    // loginRateLimiter,
    verify2FALoginController
);

authRoute.post(
    '/refresh',
    refreshTokenRotationController
)

module.exports = authRoute;
