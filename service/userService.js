const { client: redisClient } = require('../config/redisClient');
const generateOtp = require('../utils/generateOtp');
const sendEmail = require('../utils/sendEmail');
const hashData = require('../utils/hashData');
const verifyData = require('../utils/verifyData');
const { User } = require('../models');
const { Op } = require('sequelize');

const resetPasswordService = async ({ email, newPassword, otp }) => {

    const redisKey = `passwordReset:${email}`;
    const storedOtp = await redisClient.get(redisKey);
    if (!storedOtp) throw new Error('OTP expired or not found.');
    const isOtpMatch = await verifyData(otp, storedOtp);
    if (!isOtpMatch) throw new Error('Invalid OTP.');
    await redisClient.del(redisKey);
    
    const user = await User.findOne({
        where: { email }
    })

    if (!user) throw new Error(`User not found`)

    const isMatch = await verifyData(newPassword, user.password)
    if (isMatch) {
        return {
            success: false,
            message: `New password cannot be the same as previous one`
        }
    }

    const hashedNewPassword = await hashData(newPassword)

    await User.update(
        { password: hashedNewPassword },
        { where: { email } }
    )

    return {
        success: true,
        message: `Password changed successfully`
    }
}

module.exports = {
    resetPasswordService,
}