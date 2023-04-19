
const express = require('express')
const router = express.Router()
const userRouter = require('./user.route')
const eventRouter = require('./event.route')
const ideaRouter = require('./idea.route')
const categoryRoute = require('./category.route')
const commentRoute = require('./comment.route')
const departmentRoute = require('./department.route')
const qamRoute = require('./qam.route')

router.use('/user', userRouter)
router.use('/event', eventRouter)
router.use('/idea', ideaRouter)
router.use('/category', categoryRoute)
router.use('/comment', commentRoute)
router.use('/department', departmentRoute)
router.use('/qam', qamRoute)

module.exports = router
