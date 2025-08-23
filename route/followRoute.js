const express = require('express');
const {
    followController,
    unfollowController,
    getFollowersController,
    getFollowingController,
    isFollowingController,
    followersCountController,
    followingCountController
} = require('../controller/followController');
const authMiddleware = require('../middleware/authMiddleware');
const { is } = require('zod/locales');

const followRoute = express.Router();

// const disableCache = (req, res, next) => {
//   res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
//   next();
// };

// ========================== FOLLOW ==========================
followRoute.post(
    '/follow',
    authMiddleware,
    followController
);

// ========================== UNFOLLOW ==========================
followRoute.post(
    '/unfollow',
    authMiddleware,
    unfollowController
);

// ========================== GET FOLLOWERS ==========================
followRoute.get(
    '/:userId/followers',
    authMiddleware,
    getFollowersController
);

// ========================== GET FOLLOWING ==========================
followRoute.get(
    '/:userId/following',
    authMiddleware,
    getFollowingController
);

followRoute.get(
    '/is-following/:followingId',
    authMiddleware,
    isFollowingController
)

// ========================== GET FOLLOWERS COUNT ==========================
followRoute.get(
    '/:userId/followers/count',
    authMiddleware,
    followersCountController
);

// ========================== GET FOLLOWING COUNT ==========================   
followRoute.get(
    '/:userId/following/count',
    authMiddleware,
    followingCountController
);

module.exports = followRoute;