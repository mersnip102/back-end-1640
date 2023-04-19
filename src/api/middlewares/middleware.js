const express = require('express')
const app = express()
const authMiddleware = require('./auth.middleware')

app.use(authMiddleware)

module.exports = app
