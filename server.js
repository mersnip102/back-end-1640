const path = require('path')
const mongoose = require('mongoose')
const route = require('./src/api/routes/route')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const db = require('./src/config/db.config')
const cors = require('cors')
const apiResponse = require('./src/api/helpers/api.response.helper')
require('dotenv').config()

const { ServerApiVersion } = require('mongodb')
mongoose.set('strictQuery', false)
mongoose.connect(db.uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 }).then(() => {
  console.log('Database connect success!')
}).catch((err) => {
  console.error(err)
})
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
  res.setHeader('Access-Control-Allow-Credentials', true)
  next()
})

app.use('/upload', express.static(path.join(__dirname, 'upload')))
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/api/', route)
// throw 404 if URL not found
app.all('*', function (req, res) {
  return apiResponse.notFoundResponse(res, 'Page not found')
})

const port = process.env.PORT || 8888
app.listen(port, () => console.log(`Listening on port ${port}...`))
