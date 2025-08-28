const {
    createPostService, updatePostService,
    softDeletePostService,
    restoreSoftDeletedPostService,
    hardDeletePostService,
    fetchPostsOnProfile,
    fetchPostsOnFeed
} = require('../service/postService');
const asyncHandlerMiddleware = require('../middleware/asyncHandlerMiddleware');
const { createPostSchema, updatePostSchema } = require('../validator/postSchema');

exports.createPostController = asyncHandlerMiddleware(async (req, res) => {
    const userId = req.user.id;

    const validatedData = createPostSchema.parse(req.body);

    const newPost = await createPostService({
        userId,
        mediaUrl: validatedData.mediaUrl,
        title: validatedData.title,
        content: validatedData.content,
        isPrivate: false,
    });

    if (!newPost) {
        return res.status(400).json({
            success: false,
            message: 'Failed to create post'
        });
    }

    return res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: newPost
    });
});

exports.updatePostController = asyncHandlerMiddleware(async (req, res) => {
    const userId = req.user.id;
    const postId = req.params.postId;

    const validatedData = updatePostSchema.parse(req.body);

    const updatedPost = await updatePostService({
        postId,
        userId,
        title: validatedData.title,
        content: validatedData.content,
    });

    if (!updatedPost) {
        return res.status(400).json({
            success: false,
            message: "Failed to update post",
        })
    }

    return res.status(200).json({
        success: true,
        message: 'Post updated successfully',
        data: updatedPost
    });
});

exports.softDeletePostController = asyncHandlerMiddleware(async (req, res) => {
    const userId = req.user.id;
    const postId = req.params.postId;

    const softDeletedPost = await softDeletePostService({
        postId,
        userId
    });

    if (!softDeletedPost) {
        return res.status(400).json({
            success: false,
            message: 'Failed to transfer the post to bin'
        })
    }

    return res.status(200).json({
        success: true,
        message: 'Post successfully tranferred to bin',
        data: softDeletedPost
    })
});

exports.restoreSoftDeletePostController = asyncHandlerMiddleware(async (req, res) => {
    const userId = req.user.id;
    const postId = req.params.postId;

    const restoredPost = await restoreSoftDeletedPostService({
        postId,
        userId
    });

    if (!restoredPost) {
        return res.status(400).json({
            success: false,
            message: 'Failed to transfer the post to bin'
        })
    }

    return res.status(200).json({
        success: true,
        message: 'Post successfully restored',
        data: restoredPost
    })
});

exports.hardDeletePostController = asyncHandlerMiddleware(async (req, res) => {
    const userId = req.user.id;
    const postId = req.params.postId;

    const deletedPost = await hardDeletePostService({
        postId,
        userId
    });

    if (!deletedPost) {
        return res.status(400).json({
            success: false,
            message: 'Failed to delete the post'
        })
    }

    return res.status(200).json({
        success: true,
        message: 'Post successfully deleted',
    })
});

exports.fetchPostsOnProfileController = asyncHandlerMiddleware(async (req, res) => { // IMPORTANT
    const userId = req.user.id;                                                      // .query always returns a string
    const { limit = 10, cursor = null, sortType = "DESC" } = req.query;

    const parsedCursor = cursor ? JSON.parse(cursor) : null
    const intLimit = limit ? parseInt(limit) : null

    const { profileposts, nextCursor } = await fetchPostsOnProfile({
        userId,
        limit: intLimit,
        cursor: parsedCursor,
        sortType,
    });

    return res.status(200).json({
        success: true,
        message: "Posts successfully fetched on profile",
        data: profileposts,
        nextCursor
    });
});

exports.fetchpostsOnFeedController = asyncHandlerMiddleware(async (req, res) => {
    const { limit = 10, cursor = null } = req.query;

    const parsedCursor = cursor ? JSON.parse(cursor) : null
    const intLimit = limit ? parseInt(limit) : null

    const { feedPosts, nextCursor } = await fetchPostsOnFeed({
        limit: intLimit,
        cursor: parsedCursor,
    });

    return res.status(200).json({
        success: true,
        message: "Posts successfully fetched on feed",
        data: feedPosts,
        nextCursor
    })
});

exports.fetchFollowedUserPostsOnFeedController = asyncHandlerMiddleware(async (req, res) => {
    const userId = req.user.id;
    const { limit = 10, cursor = null } = req.query;

    const parsedCursor = cursor ? JSON.parse(cursor) : null;
    const intLimit = limit ? parseInt(limit) : null;

    const { posts, nextCursor } = await fetchFollowedUserPostsOnFeed({
        userId,
        limit: intLimit,
        cursor: parsedCursor
    })

    return res.status(200).json({
        success: true,
        message: "Posts successfully fetched on feed as per followed users only",
        data: posts,
        nextCursor
    })

})