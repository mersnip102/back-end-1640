const express = require('express')
const router = express.Router()
const { uploadFiles } = require('../middlewares/file.middleware')
const { isStaff, verifyToken } = require('../middlewares/auth.middleware')
const IdeaController = require('../controllers/idea.controller')

router.post('/create', [isStaff, uploadFiles], IdeaController.createIdea)
router.get('/list', verifyToken, IdeaController.paginationListIdea)
router.put('/update/:id', isStaff, IdeaController.updateIdea)
router.delete('/delete/:id', isStaff, IdeaController.deleteIdea)
router.get('/like/:id', verifyToken, IdeaController.likeIdea)
router.get('/dislike/:id', verifyToken, IdeaController.dislikeIdea)
router.get('/:id', verifyToken, IdeaController.getIdeaById)

module.exports = router
