const moment = require('moment-timezone')
const express = require('express')
const app = express()
function setTimezone (req, res, next) {
  moment.tz.setDefault('Asia/Ho_Chi_Minh')
  next()
}
