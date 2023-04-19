const express = require('express')
const router = express.Router()
const DepartmentController = require('../controllers/department.controller')
const { isAdmin, verifyToken } = require('../middlewares/auth.middleware')

router.post('/add', isAdmin, DepartmentController.createDepartment)
router.get('/list', DepartmentController.getListDepartment)
router.delete('/delete/:id', isAdmin, DepartmentController.deleteDepartment)
router.put('/update/:id', isAdmin, DepartmentController.updateDepartment)
router.get('/show/:id', DepartmentController.getEachDepartment)

module.exports = router
