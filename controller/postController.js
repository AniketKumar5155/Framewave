const { Post, User, Like, Comment } = require('../models');
const { Op } = require('sequelize');
const asyncHandlerMiddleware = require('../middleware/asyncHandlerMiddleware');
const {
    createPostService
} = require('../service/postService');

exports.createPostController = asyncHandlerMiddleware(async (req, res) => {
    const userId = req.user.id;
    const { mediaUrl, title, content } = req.body;

    if(!userId || !title || !content){
        return res.status(400).json({
            success: false,
            message: 'User ID, Title and Content are required'
        });
    }   

    const newPost = await createPostService({ userId, mediaUrl, title, content})

    if(!newPost){
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
})