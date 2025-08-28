const express = require('express');
const { 
    createPostController,
    updatePostController,
    softDeletePostController,
    restoreSoftDeletePostController,
    hardDeletePostController,
    fetchPostsOnProfileController,
    fetchpostsOnFeedController,
 } = require('../controller/postController');
 const authMiddleware = require('../middleware/authMiddleware');

 const postRoute = express.Router();

// ========================== CREATE POST ==========================
postRoute.post(
    '/',
    authMiddleware,
    createPostController
);

// ========================== UPDATE POST ==========================
postRoute.post(
    '/:postId/update',
    authMiddleware,
    updatePostController
)

postRoute.patch(
    '/:postId/soft-delete-post',
    authMiddleware,
    softDeletePostController
)

postRoute.patch(
    '/:postId/restore-soft-delete-post',
    authMiddleware,
    restoreSoftDeletePostController
)

postRoute.delete(
    '/:postId/hard-delete-post',
    authMiddleware,
    hardDeletePostController
)

postRoute.get(
    '/fetch-profile-posts',
    authMiddleware,
    fetchPostsOnProfileController
)

postRoute.get(
    '/fetch-feed-posts',
    authMiddleware,
    fetchpostsOnFeedController
)

module.exports = postRoute;