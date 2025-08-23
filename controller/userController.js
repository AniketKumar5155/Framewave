const { 
    resetPasswordService,
    getAllUsersService
} = require(`../service/userService`)
const asyncHandler = require(`../middleware/asyncHandlerMiddleware`)

exports.resetPasswordController = asyncHandler(async (req, res) => {
    const { email, newPassword, otp } = req.body;
    if(!email || !newPassword || !otp){
        return res.status(400).json({
            success: false,
            message: `Email, new password and otp is required`
        })
    }

    await resetPasswordService({ email, newPassword, otp })

    return res.status(200).json({
        success: true,
        message: `Password updated successfully`
    })
})

exports.getAllUsersController = asyncHandler(async (req, res) => {
    const users = await getAllUsersService();
    if (!users || users.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'No users found',
        });
    }
    return res.status(200).json({
        success: true,
        message: 'Users fetched successfully',
        data: users,
    });
});


