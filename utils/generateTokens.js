const JWT = require('jsonwebtoken')

const generateTokens = ({ userId, email, username }) => {

    const payload = { userId, email, username }

    const accessToken = JWT.sign(payload, process.env.SECRET_ACCESS_TOKEN, {
        expiresIn: '15m',
        issuer: 'insta-clone'
    })
    const refreshToken = JWT.sign(payload, process.env.SECRET_REFRESH_TOKEN, {
        expiresIn: '7d',
        issuer: 'insta-clone'
    })

    return {
        accessToken,
        refreshToken
    }
}

module.exports = generateTokens