const JWT = require('jsonwebtoken')
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    try {
        if (!authHeader || !authHeader.startsWith(`Bearer `)) {
            return res.status(401).json({
                success: false,
                message: `No token provided`
            })
        }

        const token = authHeader.split(' ')[1];

        const decoded = JWT.verify(token, process.env.SECRET_ACCESS_TOKEN)
        const user = await User.findByPk(decoded.userId)

        if (!user || user.is_deleted || user.is_banned || !user.is_active) {
            return res.status(403).json({
                success: false,
                message: `Access denied, Invalid user.`
            })
        }

        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
        };

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = authMiddleware;