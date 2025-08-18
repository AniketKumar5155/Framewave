const express = require('express')
const {
    getProfileController,
    updateProfileController
} = require('../controller/profileController')
const authMiddleware = require('../middleware/authMiddleware')


const profileRoute = express.Router();

profileRoute.get('/me', authMiddleware, getProfileController);
profileRoute.patch('/edit', authMiddleware, updateProfileController)

profileRoute.get('/:username', authMiddleware, getProfileController);


module.exports = profileRoute;
