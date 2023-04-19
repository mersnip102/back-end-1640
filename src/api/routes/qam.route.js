const express = require('express')
const router = express.Router()
const { isQAM, verifyToken } = require('../middlewares/auth.middleware')
const qamController = require('../controllers/qam.controller')
const dashboardController = require('../controllers/dashboard.controller')

router.get('/download-files', isQAM, qamController.downloadFile)
router.get('/get-event-document', isQAM, qamController.listDocumentInfo)
router.get('/detail-document/:id', isQAM, qamController.detailDocument)
router.get('/download-csv/:id', isQAM, qamController.downloadFilecsv)
router.get('/dowload/:file', isQAM, qamController.dowloadFile)
router.get('/dashboard',verifyToken, dashboardController.ideaOfDepartmentOrCategory)
module.exports = router
