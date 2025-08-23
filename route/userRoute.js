const express = require('express')
const {
    resetPasswordController,
    getAllUsersController
} = require(`../controller/userController`)
const authMiddleware = require('../middleware/authMiddleware')

const userRoute = express.Router()

userRoute.patch(
    '/password-reset',
    authMiddleware,
    resetPasswordController,
)

userRoute.get(
    '/all-users',
    authMiddleware,
    getAllUsersController
)

module.exports = userRoute


