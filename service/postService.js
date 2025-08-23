const Post = require('../models');

const createPostService = async ({ userId, mediaUrl, title, content}) => {

    if(!userId){
        throw new Error('User ID is required');
    }
    else if(!title){
        throw new Error('Title is required');
    }
    else if(!content){
        throw new Error('Content is required');
    }

    const newPost = await Post.create({
        user_id: userId,
        media_url: mediaUrl,
        title,
        content,
    });

    return newPost;
}