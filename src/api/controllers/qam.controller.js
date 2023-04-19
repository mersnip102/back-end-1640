
const archiver = require('archiver')
const apiResponse = require('../helpers/api.response.helper')
const { Event } = require('../models/event.model')
const Languages = require('../utils/languages')
const createCsvWriter = require('csv-writer').createObjectCsvWriter
const fs = require('fs')
const path = require('path')

module.exports = {
  async downloadFile (req, res) {
    try {
      const folderPath = path.join(__dirname, '../../../upload')
      const timestamp = Date.now()
      const zipPath = path.join(__dirname, `../../../compress/${timestamp}_allFiles.zip`)

      const output = fs.createWriteStream(zipPath)
      const archive = archiver('zip', { zlib: { level: 9 } })
      archive.pipe(output)

      const files = await fs.promises.readdir(folderPath)
      for (const file of files) {
        const filePath = path.join(folderPath, file)
        const stat = await fs.promises.stat(filePath)
        if (stat.isFile()) {
          const ext = path.extname(file)
          if (ext === '.pdf' || ext === '.docx' || ext === '.doc') {
            archive.file(filePath, { name: file })
          }
        }
      }
      await archive.finalize()
      res.download(zipPath)
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async listDocumentInfo (req, res) {
    try {
      const document = await Event.find({}, { _id: 0, __v: 0, idea: 0 })
      return apiResponse.response_data(res, Languages.SUCCESSFUL, 200, document)
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async detailDocument (req, res) {
    try {
      const id = req.params.id
      const detail = await Event.findOne({ id }, { _id: 0, __v: 0 }).populate({
        path: 'idea',
        select: 'user title content totalLike totalDislike totalViews totalComment createdAt file -_id',
        populate: [
          { path: 'user', select: 'id userId fullName email avatar -_id' },
          { path: 'file', select: 'file -_id' }
        ]
      })
      return apiResponse.response_data(res, Languages.SUCCESSFUL, 200, detail)
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async dowloadFile (req, res) {
    try {
      const file = path.join(__dirname, `../../../upload/${req.params.file}`)
      res.download(file)
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async downloadFilecsv (req, res) {
    try {
      const id = req.params.id
      const detail = await Event.findOne({ id }, { _id: 0, __v: 0 }).populate({
        path: 'idea',
        select: ' id user title content totalLike totalDislike totalViews totalComment createdAt file -_id',
        populate: [
          { path: 'user', select: 'id userId fullName email avatar -_id' },
          { path: 'file', select: 'file -_id' }
        ]
      })
      if (!detail) {
        return apiResponse.response_error_500(res, detail)
      }
      const csvFields = [
        { id: 'id', title: 'Idea Id' },
        { id: 'title', title: 'Title' },
        { id: 'content', title: 'Content' },
        { id: 'document', title: 'Documents' },
        { id: 'totalLike', title: 'Total Like' },
        { id: 'totalDislike', title: 'Total Dislike' },
        { id: 'totalViews', title: 'Total Views' },
        { id: 'totalComment', title: 'Total Comment' }
      ]
      const csvWriter = createCsvWriter({
        path: 'ideas.csv',
        header: csvFields
      })
      const csvData = detail.idea.map(data => {
        const documents = data.file.file.join(',')
        return {
          id: data.id,
          title: data.title,
          content: data.content,
          document: documents,
          totalLike: data.totalLike,
          totalDislike: data.totalDislike,
          totalViews: data.totalViews,
          totalComment: data.totalComment
        }
      })
      await csvWriter.writeRecords(csvData).then(() => {
        console.log('CSV file created successfully')

        // Read the file and send it to client
        fs.readFile('ideas.csv', (err, data) => {
          if (err) {
            console.log(err)
          } else {
            res.setHeader('Content-Type', 'text/csv')
            res.setHeader('Content-Disposition', 'attachment; filename=ideas.csv')
            res.send(data)
          }
        })
      })
        .catch((err) => {
          return apiResponse.response_error_500(res, err.message)
        })
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  }
}
