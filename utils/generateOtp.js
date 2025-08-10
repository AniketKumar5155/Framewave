const crypto = require('crypto');

const generateOtp = () => {
  try {
    const otp = crypto.randomInt(10000, 100000).toString().padStart(6, '0');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

    return { otp, expiresAt };
  } catch (error) {
    console.error(`Failed to generate OTP: ${error}`);
    throw new Error('OTP generation failed'); 
  }
};

module.exports = generateOtp;