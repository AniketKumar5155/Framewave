const express = require('express')
const {
    resetPasswordController
} = require(`../controller/userController`)
const authMiddleware = require('../middleware/authMiddleware')

const userRoute = express.Router()

userRoute.patch(
    '/password-reset',
    authMiddleware,
    resetPasswordController,
)

module.exports = {
    userRoute
}


