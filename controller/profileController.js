const asyncHandlerMiddleware = require('../middleware/asyncHandlerMiddleware');
const { getProfileService, updateProfileService } = require('../service/profileService');
const { updateProfileSchema } = require('../validator/profileSchema');

exports.getProfileController = asyncHandlerMiddleware(async (req, res) => {
  const username = req.params.username || req.user.username;

  if (!username) {
    return res.status(400).json({
      success: false,
      message: 'Username is required',
    });
  }

  const user = await getProfileService(username);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'User profile fetched successfully',
    data: user,
  });
});

exports.updateProfileController = asyncHandlerMiddleware(async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.errors,
    });
  }

  const usernameToUpdate = req.params.username || req.user.username;

  if (usernameToUpdate !== req.user.username) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You cannot edit this profile',
    });
  }

  const user = await updateProfileService(usernameToUpdate, parsed.data);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'User profile updated successfully',
    data: user,
  });
});
