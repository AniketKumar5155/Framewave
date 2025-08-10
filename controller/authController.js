const asyncHandler = require('../middleware/asyncHandlerMiddleware');
const { signupSchema, loginSchema, verify2FALoginSchema } = require('../validator/authSchema');
const { signupService, loginService, verify2FALoginService } = require('../service/authService');
const axios = require('axios');

exports.signupController = asyncHandler(async (req, res) => {

    const validated = signupSchema.safeParse(req.body);

    if (!validated.success) {
        return res.status(400).json({
            success: false,
            message: "Signup validation failed",
            error: validated.error.errors,
        });
    }

    const ip = req.ip;
    const userAgent = req.get('User-Agent') || 'unknown';
    let location = 'Unknown';

    try {
        const geo = await axios.get(`https://ipapi.co/${ip}/json/`);
        location = `${geo.data.city || 'N/A'}, ${geo.data.region || 'N/A'}, ${geo.data.country_name || 'N/A'}`;
    } catch (err) {
        console.error('Geo lookup failed:', err.message);
    }

    const { user, token } = await signupService(validated.data, { ip, userAgent, location });

    res.cookie("refreshToken", token.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
        success: true,
        message: "User registered successfully",
        user,
        accessToken: token.accessToken,
    });
});

exports.loginController = asyncHandler(async (req, res) => {
    const validated = loginSchema.safeParse(req.body);

    if (!validated.success) {
        return res.status(400).json({
            success: false,
            message: "Login validation failed",
            error: validated.error.errors,
        });
    }

    const ip = req.ip;
    const userAgent = req.get('User-Agent') || 'unknown';
    let location = 'Unknown';

    try {
        const geo = await axios.get(`https://ipapi.co/${ip}/json/`);
        location = `${geo.data.city || 'N/A'}, ${geo.data.region || 'N/A'}, ${geo.data.country_name || 'N/A'}`;
    } catch (err) {
        console.error('Geo lookup failed:', err.message);
    }

    const result = await loginService(validated.data, { ip, userAgent, location });

    if (result.requires2FA) {
        return res.status(200).json({
            success: false,
            message: result.message,
            requires2FA: true,
            userId: result.userId
        });
    }

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
        success: true,
        message: result.message,
        user: result.user,
        accessToken: result.accessToken,
    });
});

exports.verify2FALoginController = asyncHandler(async (req, res) => {
    console.log(req.body)
    const validated = verify2FALoginSchema.safeParse(req.body);
    console.log(validated)
    if (!validated.success) {
        return res.status(400).json({
            success: false,
            message: "2FA verification validation failed",
            error: validated.error,
        });
    }

    const ip = req.ip;
    const userAgent = req.get('User-Agent') || 'unknown';
    let location = 'Unknown';

    try {
        const geo = await axios.get(`https://ipapi.co/${ip}/json/`);
        location = `${geo.data.city || 'N/A'}, ${geo.data.region || 'N/A'}, ${geo.data.country_name || 'N/A'}`;
    } catch (err) {
        console.error('Geo lookup failed:', err.message);
    }

    const result = await verify2FALoginService(validated.data, { ip, userAgent, location });

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
        success: true,
        message: result.message,
        user: result.user,
        accessToken: result.accessToken,
    });
});
