const { Post, Follow } = require('../models');
const { Op } = require('sequelize');
const {
    addToCache,
    updateItemInCache,
    invalidateCache,
} = require('../utils/cacheHelper');

const createPostService = async ({ userId, mediaUrl, title, content, isPrivate }) => {
    const post = await Post.create({
        user_id: userId,
        media_url: mediaUrl,
        title: title.trim(),
        content: content.trim(),
        is_private: Boolean(isPrivate)
    });

    const redisKey = `createPost:${userId}`;
    await addToCache(post, [redisKey]);
    return post;
};

const updatePostService = async ({ postId, userId, title, content, isPrivate }) => {
    const post = await Post.findByPk(postId);
    if (!post) throw new Error('Post not found');
    if (post.user_id !== userId) throw new Error('Not authorized');

    post.title = title?.trim() ?? post.title;
    post.content = content?.trim() ?? post.content;
    if (typeof isPrivate === 'boolean') post.is_private = isPrivate;

    const updatedPost = await post.save();
    const redisKeys = [`postsOnProfile:${userId}`, `postsOnFeed`, `postsOnPostsFollowersOnly:${userId}`];
    await updateItemInCache(updatedPost, postId, redisKeys);

    return updatedPost;
};

const softDeletePostService = async ({ postId, userId }) => {
    const post = await Post.findByPk(postId);
    if (!post) throw new Error('Post not found');
    if (post.user_id !== userId) throw new Error('Not authorized');
    if (post.is_deleted) throw new Error('Post already in bin');

    post.is_deleted = true;
    await post.save();

    const redisKeys = [`postsOnProfile:${userId}`, `postsOnFeed`, `postsOnPostsFollowersOnly:${userId}`];
    await invalidateCache(redisKeys);

    return post;
};

const restoreSoftDeletedPostService = async ({ postId, userId }) => {
    const post = await Post.findByPk(postId);
    if (!post) throw new Error('Post not found');
    if (post.user_id !== userId) throw new Error('Not authorized');
    if (!post.is_deleted) throw new Error('Post is not deleted');

    post.is_deleted = false;
    await post.save();

    const redisKeys = [`postsOnProfile:${userId}`, `postsOnFeed`, `postsOnPostsFollowersOnly:${userId}`];
    await addToCache(post, redisKeys);

    return post;
};

const hardDeletePostService = async ({ postId, userId }) => {
    const post = await Post.findByPk(postId);
    if (!post) throw new Error('Post not found');
    if (!post.is_deleted) throw new Error('Post not in bin');
    if (post.user_id !== userId) throw new Error('Not authorized');

    await post.destroy();

    const redisKeys = [`postsOnProfile:${userId}`, `postsOnFeed`, `postsOnPostsFollowersOnly:${userId}`];
    await invalidateCache(redisKeys);

    return true;
};

const fetchPostsOnProfile = async ({ userId, limit = 10, cursor = null, sortType = 'DESC' }) => {
    const operator = sortType === 'DESC' ? Op.lt : Op.gt;
    const cursorCondition = cursor
        ? { [Op.or]: [{ created_at: { [operator]: cursor.created_at } }, { created_at: cursor.created_at, id: { [operator]: cursor.id } }] }
        : {};

    const posts = await Post.findAll({
        where: { user_id: userId, ...cursorCondition },
        order: [
            ['created_at', sortType],
            ['id', sortType]
        ],
        limit: limit + 1
    });

    let nextCursor = null;
    if (posts.length > limit) {
        const nextPost = posts.pop();
        nextCursor = { created_at: nextPost.created_at, id: nextPost.id };
    }

    const result = { posts, nextCursor };
    await addToCache(result, [`postsOnProfile:${userId}`]);
    return result;
};

const fetchPostsOnFeed = async ({ limit = 10, cursor = null }) => {
    const cursorCondition = cursor
        ? { [Op.or]: [{ created_at: { [Op.lt]: cursor.created_at } }, { created_at: cursor.created_at, id: { [Op.lt]: cursor.id } }] }
        : {};

    const posts = await Post.findAll({
        where: { ...cursorCondition },
        order: [
            ['created_at', 'DESC'],
            ['id', 'DESC']
        ],
        limit: limit + 1
    });

    let nextCursor = null;
    if (posts.length > limit) {
        const lastPost = posts.pop();
        nextCursor = { created_at: lastPost.created_at, id: lastPost.id };
    }

    const result = { posts, nextCursor };
    await addToCache(result, ['postsOnFeed']);
    return result;
};

const fetchFollowedUserPostsOnFeed = async ({ userId, limit = 10, cursor = null }) => {
    const followingIds = (await Follow.findAll({ where: { follower_id: userId } })).map(f => f.following_id);

    const cursorCondition = cursor
        ? { [Op.or]: [{ created_at: { [Op.lt]: cursor.created_at } }, { created_at: cursor.created_at, id: { [Op.lt]: cursor.id } }] }
        : {};

    const posts = await Post.findAll({
        where: { user_id: { [Op.in]: followingIds }, ...cursorCondition },
        order: [['created_at', 'DESC'], ['id', 'DESC']],
        limit: limit + 1
    });

    let nextCursor = null;
    if (posts.length > limit) {
        const lastPost = posts.pop();
        nextCursor = { created_at: lastPost.created_at, id: lastPost.id };
    }

    const result = { posts, nextCursor };
    await addToCache(result, [`postsOnPostsFollowersOnly:${userId}`]);
    return result;
};

module.exports = {
    createPostService,
    updatePostService,
    softDeletePostService,
    restoreSoftDeletedPostService,
    hardDeletePostService,
    fetchPostsOnProfile,
    fetchPostsOnFeed,
    fetchFollowedUserPostsOnFeed
};
