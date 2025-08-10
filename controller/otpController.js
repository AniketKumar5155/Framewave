const asyncHandler = require('../middleware/asyncHandlerMiddleware');
const { sendOtpService, verifyOtpService, send2FAOtpService, verify2FAOtpService } = require('../service/otpService');
const { User } = require('../models');
const { Op } = require('sequelize');
const { success } = require('zod');

exports.sendOtpController = asyncHandler(async (req, res) => {
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({
      success: false,
      message: `Email and username are required`
    });
  }

  await sendOtpService({ username, email });

  return res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
  });
});

exports.verifyOtpController = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }

  await verifyOtpService({ email, otp });

  return res.status(200).json({
    success: true,
    message: `OTP verifified successfully`
  });
});

exports.send2FAOtpController = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(404).json({
      success: false,
      message: `Identifier and Password are required.`
    })
  }

  const user = await User.findOne({
    $or: [{ username: identifier }, { email: identifier }]
  });
  if (!user) throw new Error("User not found");
  await send2FAOtpService({ username: user.username, email: user.email });


  return res.status(200).json({
    success: true,
    message: `OTP sent successfully`
  })
});

exports.verify2FAOtpController = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Email and OTP are required'
    });
  }

  const result = await verify2FAOtpService({ email, otp });
  return res.status(200).json(result);
});

