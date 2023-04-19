const path = require('path')
const fs = require('fs')
const directoryFile = path.join(__dirname, '../../../upload/')
const apiResponse = require('../helpers/api.response.helper')
const Languages = require('../utils/languages')

function unlinkFile (file) {
  fs.unlink(file, function (err) {
    if (err) {
      console.log('Error deleting file:', err)
    } else {
      console.log(`File deleted successfully.${file}`)
    }
  })
}
function checkFile (list, res) {
  if (list === undefined || list.length === 0) {
    // do something when list is undefined or empty
    return apiResponse.response_status(res, Languages.UPLOAD_AVATAR_FAIL, 400)
  }

  if (list.length > 1) {
    list.forEach(element => {
      if (element !== undefined && element.endsWith && (element.endsWith('.pdf') || element.endsWith('.docs'))) {
        unlinkFile(directoryFile + element)
      }
    })
    return apiResponse.response_status(res, Languages.UPLOAD_AVATAR_FAIL, 400)
  }
  if (list[0] === undefined || list[0].endsWith === undefined) {
    return apiResponse.response_status(res, Languages.UPLOAD_AVATAR_FAIL, 400)
  }
  if (list[0].endsWith('.pdf') || list[0].endsWith('.docs')) {
    unlinkFile(directoryFile + list[0])
    return apiResponse.response_status(res, Languages.UPLOAD_AVATAR_FAIL, 400)
  }
}
module.exports = {
  checkFile, unlinkFile
}
