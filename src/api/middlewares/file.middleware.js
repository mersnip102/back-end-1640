const util = require('util')
const multer = require('multer')
const path = require('path')
let listFile = []
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../upload'))
  },
  filename: (req, file, cb) => {
    console.log(file);
    const filname = `${Date.now()}_${file.originalname}`
    cb(null, filname)
    listFile.push(filname)
  }
})
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname)
  const allowed = ['.png', '.jpg', '.jpeg', '.pdf', '.doc', '.docs', '.docx']
  if (allowed.includes(ext)) {
    cb(null, true)
  } else {
    return cb(new Error('docs, doc, pdf'), false)
  }
}

const maxSize = 5 * 1024 * 1024
const fileLimits = {
  fileSize: maxSize,
  files: 5
}

const uploadFile = multer({ storage, fileFilter, limits: fileLimits }).array('files', 5)
const uploadFilesMiddleware = util.promisify(uploadFile)

exports.uploadFiles = async (req, res, next) => {
  listFile = []
  await uploadFilesMiddleware(req, res)
  if (listFile.length !== 0) {
    req.listFile = listFile
  } else { req.listFile = [] }
  next()
}
