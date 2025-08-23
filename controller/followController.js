const {
    followService,
    unfollowService,
    getFollowersService,
    getFollowingService,
    isFollowingService,
    followersCountService,
    followingCountService
} = require('../service/followService');
const asyncHandlerMiddlware = require('../middleware/asyncHandlerMiddleware');

exports.followController = asyncHandlerMiddlware(async (req, res) => {
    const { followingId } = req.body;
    if (!followingId) {
        return res.status(400).json({
            success: false,
            message: 'Following ID is required'
        });
    }

    const followerId = req.user.id;
    const result = await followService({ followerId, followingId });

    return res.status(200).json({
        success: true,
        message: 'Followed successfully',
        data: result
    });
});

exports.unfollowController = asyncHandlerMiddlware(async (req, res) => {
    const { followingId } = req.body;
    if (!followingId) {
        return res.status(400).json({
            success: false,
            message: 'Following ID is required'
        });
    }

    const followerId = req.user.id;
    const result = await unfollowService({ followerId, followingId });

    return res.status(200).json({
        success: true,
        message: 'Unfollowed successfully',
        data: result
    });
});

exports.getFollowersController = asyncHandlerMiddlware(async (req, res) => {
    const userId = req.params.userId || req.user.id;
    const followers = await getFollowersService(userId);

    return res.status(200).json({
        success: true,
        message: 'Followers fetched successfully',
        data: followers
    });
});

exports.getFollowingController = asyncHandlerMiddlware(async (req, res) => {
    const userId = req.params.userId || req.user.id;
    const following = await getFollowingService(userId);

    return res.status(200).json({
        success: true,
        message: 'Following fetched successfully',
        data: following
    });
});

exports.isFollowingController = asyncHandlerMiddlware(async (req, res) => {
    const followerId = req.user.id; 
    const { followingId } = req.params;

    if (!followingId) {
        return res.status(400).json({
            success: false,
            message: 'Following ID is required'
        });
    }

    const isFollowing = await isFollowingService(followerId, followingId);

    return res.status(200).json({
        success: true,
        message: 'Following status fetched successfully',
        data: isFollowing 
    });
});

exports.followersCountController = asyncHandlerMiddlware(async (req, res) => {
    const userId = req.params.userId || req.user.id;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: 'User ID is required'
        });
    }

    const count = await followersCountService(userId);

    return res.status(200).json({
        success: true,
        message: 'Followers count fetched successfully',
        data: count
    });
});

exports.followingCountController = asyncHandlerMiddlware(async (req, res) => {
    const userId = req.params.userId || req.user.id;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: 'User ID is required'
        });
    }

    const count = await followingCountService(userId);

    return res.status(200).json({
        success: true,
        message: 'Following count fetched successfully',
        data: count
    });
});
