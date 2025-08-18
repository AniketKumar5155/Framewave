const asyncHandler = require('../middleware/asyncHandlerMiddleware');
const { signupSchema, loginSchema, verify2FALoginSchema } = require('../validator/authSchema');
const { signupService, loginService, verify2FALoginService, refreshTokenRotationService, logoutService } = require('../service/authService');
const axios = require('axios');

const getMeta = async (req) => {
    const ip = req.ip;
    const userAgent = req.get('User-Agent') || 'unknown';
    let location = 'Unknown';
    try {
        const geo = await axios.get(`https://ipapi.co/${ip}/json/`);
        location = `${geo.data.city || 'N/A'}, ${geo.data.region || 'N/A'}, ${geo.data.country_name || 'N/A'}`;
    } catch (err) {
        console.error('Geo lookup failed:', err.message);
    }
    return { ip, userAgent, location };
};

// ================= SIGNUP =================
exports.signupController = asyncHandler(async (req, res) => {
    const validated = signupSchema.safeParse(req.body);
    if (!validated.success) {
        return res.status(400).json({
            success: false,
            message: "Signup validation failed",
            data: validated.error.errors,
        });
    }

    const meta = await getMeta(req);
    const { user, token } = await signupService(validated.data, meta);

    res.cookie("refreshToken", token.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: { user, accessToken: token.accessToken },
    });
});

// ================= LOGIN =================
exports.loginController = asyncHandler(async (req, res) => {
    const validated = loginSchema.safeParse(req.body);
    if (!validated.success) {
        return res.status(400).json({
            success: false,
            message: "Login validation failed",
            data: validated.error.errors,
        });
    }

    const meta = await getMeta(req);
    const result = await loginService(validated.data, meta);

    if (result.requires2FA) {
        return res.status(200).json({
            success: false,
            message: result.message,
            data: { userId: result.userId },
        });
    }

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
        success: true,
        message: result.message,
        data: { user: result.user, accessToken: result.accessToken },
    });
});

// ================= VERIFY 2FA LOGIN =================
exports.verify2FALoginController = asyncHandler(async (req, res) => {
    const validated = verify2FALoginSchema.safeParse(req.body);
    if (!validated.success) {
        return res.status(400).json({
            success: false,
            message: "2FA verification validation failed",
            data: validated.error,
        });
    }

    const meta = await getMeta(req);
    const result = await verify2FALoginService(validated.data, meta);

    // ✅ Use result.refreshToken instead of token.refreshToken
    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
        success: true,
        message: result.message,
        data: { user: result.user, accessToken: result.accessToken },
    });
});

// ================= REFRESH TOKEN =================
exports.refreshTokenRotationController = asyncHandler(async (req, res) => {
    let oldRefreshToken = req.cookies?.refreshToken || req.headers.authorization;
    if (oldRefreshToken?.startsWith('Bearer ')) oldRefreshToken = oldRefreshToken.split(' ')[1];

    if (!oldRefreshToken) {
        return res.status(401).json({
            success: false,
            message: 'Refresh token not found',
        });
    }

    const meta = await getMeta(req);
    try {
        const tokens = await refreshTokenRotationService(oldRefreshToken, meta);

        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: { accessToken: tokens.accessToken },
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message || 'Failed to refresh token',
        });
    }
});

// ================= LOGOUT =================
exports.logoutController = asyncHandler(async (req, res) => {
    let refreshToken = req.cookies?.refreshToken || req.body?.refreshToken || req.headers.authorization;
    if (refreshToken?.startsWith('Bearer ')) refreshToken = refreshToken.split(' ')[1];

    if (!refreshToken) {
        return res.status(400).json({
            success: false,
            message: 'Refresh token not provided',
        });
    }

    const meta = await getMeta(req);
    const result = await logoutService(refreshToken, meta);

    if (req.cookies?.refreshToken) {
        res.clearCookie('refreshToken', { httpOnly: true, secure: false, sameSite: 'strict' });
    }

    res.status(200).json({
        success: true,
        message: result.message,
    });
});
