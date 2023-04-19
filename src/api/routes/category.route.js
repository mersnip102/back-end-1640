const express = require('express')
const router = express.Router()
const CategoryController = require('../controllers/category.controller')
const { isQAM } = require('../middlewares/auth.middleware')

router.post('/add', isQAM, CategoryController.createCategory)
router.get('/list', CategoryController.getListCategory)
router.get('/list-idea/:id', CategoryController.listIdeaCategory)
router.delete('/delete/:id', isQAM, CategoryController.deleteCategory)
router.get('/show/:id', CategoryController.getEachCategory)

module.exports = router
