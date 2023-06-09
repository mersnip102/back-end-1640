const express = require('express')
const router = express.Router()
const AuthController = require('../controllers/auth.controller')
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware')
const UserController = require('../controllers/user.controller')
const { uploadFiles } = require('../middlewares/file.middleware')

router.post('/register', [isAdmin, uploadFiles], AuthController.registerUser)
router.post('/login', AuthController.loginUser)
router.post('/refresh_token', AuthController.refreshToken)
router.post('/logout', verifyToken, AuthController.logout)
router.put('/update/:id', isAdmin, UserController.updateUser)
router.post('/delete/:id', isAdmin, UserController.deleteUser)
router.put('/change-password', isAdmin, UserController.changePassword)
router.get('/list-user', verifyToken, UserController.getListUser)
router.get('/:id', verifyToken, UserController.getUserById)
router.put('/update-profile/:id', [verifyToken, uploadFiles], UserController.updateProfileUser)
router.put('/change-password-user/:id', verifyToken, UserController.changePasswordUser)

module.exports = router
