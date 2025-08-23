const { Follow, User } = require('../models');
const { Op } = require('sequelize'); // import Sequelize operators

const followService = async ({ followerId, followingId }) => {
    if (followerId === followingId) {
        throw new Error('You cannot follow yourself');
    }

    const follower = await User.findByPk(followerId);
    const following = await User.findByPk(followingId);
    if (!follower || !following) {
        throw new Error('User not found');
    }

    const alreadyFollowing = await Follow.findOne({
        where: { follower_id: followerId, following_id: followingId }
    });

    if (alreadyFollowing) {
        throw new Error('You are already following this user');
    }

    const newFollow = await Follow.create({
        follower_id: followerId,
        follower_username: follower.username,
        following_id: followingId,
        following_username: following.username
    });

    return newFollow;
};

const unfollowService = async ({ followerId, followingId }) => {
    if (followerId === followingId) {
        throw new Error('You cannot unfollow yourself');
    }

    const follower = await User.findByPk(followerId);
    const following = await User.findByPk(followingId);
    if (!follower || !following) {
        throw new Error('User not found');
    }

    const alreadyFollowing = await Follow.findOne({
        where: {
            follower_id: followerId,
            following_id: followingId
        }
    });

    if (!alreadyFollowing) {
        throw new Error('You are not following this user');
    }

    await Follow.destroy({
        where: { follower_id: followerId, following_id: followingId }
    });

    return { message: 'Unfollowed successfully' };
};

const getFollowersService = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    const followers = await Follow.findAll({
        where: { following_id: userId },
        include: [
            {
                model: User,
                as: 'Follower',
                attributes: ['id', 'username', 'email']
            }
        ]
    })
      
    console.log('All',  followers, userId);

    const filtered = followers.filter(f => f.follower_id !== userId);
    console.log('Filtered followers:', filtered.map(f => f.Follower?.username));

    return filtered;

};

const getFollowingService = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    const following = await Follow.findAll({
        where: { follower_id: userId },
        include: [
            {
                model: User,
                as: 'Following',
                attributes: ['id', 'username', 'email']
            }
        ]
    });

      
console.log('All',  following, userId);

    const filtered = following.filter(f => f.following_id !== userId);
    console.log('Filtered followers:', filtered.map(f => f.Following?.username));
    return filtered;
};

const isFollowingService = async (followerId, followingId) => {
    if (followerId === followingId) {
        throw new Error('You cannot check following status for yourself');
    }
    const followRelation = await Follow.findOne({
        where: { follower_id: followerId, following_id: followingId }
    });
    return !!followRelation;
};

const followersCountService = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    const count = await Follow.count({
        where: { following_id: userId }
    });
    return count;
};

const followingCountService = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    const count = await Follow.count({
        where: { follower_id: userId }
    });
    return count;
};

module.exports = {
    followService,
    unfollowService,
    getFollowersService,
    getFollowingService,
    isFollowingService,
    followersCountService,
    followingCountService,
};
