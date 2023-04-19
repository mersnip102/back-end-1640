const { User, validate } = require('../models/user.model')
const jwt = require('jsonwebtoken')
const apiResponse = require('../helpers/api.response.helper')
const Joi = require('joi')
const Languages = require('../utils/languages')
const bcrypt = require('bcrypt')
const getNextSequenceValue = require('../utils/icrement.db')
require('dotenv').config()
const path = require('path')
const { transporter, mailCreatedAccountOptions } = require('../utils/sendEmail')
const { Department } = require('../models/department.model')
const { checkFile, unlinkFile } = require('../utils/utils')

let refreshTokens = []
const schemaLoginUser = Joi.object({
  email: Joi.string().required().email(),
  password: Joi.string().required()
})

exports.registerUser = async (req, res) => {
  const directoryFile = path.join(__dirname, '../../../upload/')
  const listFile = req.listFile
  if (listFile.length > 0) {
    checkFile(listFile, res)
  }
  try {
    const { email, password, department, role, lastName, firstName } = req.body
    const result = validate(req.body)
    if (result.error) {
      listFile.forEach(element => {
        unlinkFile(directoryFile + element)
      })
      return apiResponse.response_status(res, result.error.message, 400)
    }
    if (role === 1 || role === 2) {
      if (department !== undefined) {
        return apiResponse.response_status(res, Languages.DEPARTMENT_NOT_SUITABLE, 400)
      }
    }
    const departments = await Department.findOne({ name: department }, '_id')
    if (departments == null) {
      return apiResponse.response_status(res, Languages.DEPARTMENT_NOT_EXSITS, 400)
    }
    const user = await User.findOne({ email })
    if (user) {
      listFile.forEach(element => {
        unlinkFile(directoryFile + element)
      })
      return apiResponse.response_status(res, Languages.EMAIL_EXSITS, 400)
    }
    {
      const salt = await bcrypt.genSalt(10)
      const hashPassword = await bcrypt.hash(password, salt)
      const userId = await getNextSequenceValue('userId')
      const user = new User({
        avatar: listFile.length > 0 ? listFile[0] : 'default-avatar.png',
        email,
        password: hashPassword,
        department: departments._doc._id,
        role,
        lastName,
        firstName,
        fullName: firstName + ' ' + lastName,
        userId
      })
      await user.save()
      await Department.findOneAndUpdate({ _id: departments._doc._id }, { $push: { user: user._doc._id }}, { new: true })
      transporter.sendMail(mailCreatedAccountOptions(user.email, password))
      return apiResponse.response_data(res, Languages.REGISTER_SUCCESS, 200, user)
    }
  } catch (error) {
    listFile.forEach(element => {
      unlinkFile(directoryFile + element)
    })
    return apiResponse.response_error_500(res, error.message)
  }
}
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body
    const result = schemaLoginUser.validate(req.body)
    if (result.error) {
      return apiResponse.response_status(res, result.error.message, 400)
    }
    const user = await User.findOne({ email })
    if (user) {
      const resultPassword = await bcrypt.compare(password, user.password)
      if (resultPassword) {
        const accessToken = jwt.sign({
          id: user.userId,
          role: user.role,
          fullName: user.fullName,
          _id: user._id,
          _departmentId: user.department
        },
        '10',
        { expiresIn: '60d' })
        const refreshToken = jwt.sign({
          id: user._id,
          role: user.role
        },
        '11',
        { expiresIn: '60d' })
        refreshTokens.push(refreshToken)
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: false,
          path: '/',
          sameSite: 'strict'
        })
        return apiResponse.response_token(res, Languages.SUCCESSFUL, accessToken, refreshToken)
      } else {
        return apiResponse.response_status(res, Languages.LOGIN_FAIL, 400)
      }
    } else { return apiResponse.response_status(res, Languages.ACCOUNT_NOT_EXISTS, 400) }
  } catch (error) {
    return apiResponse.response_error_500(res, error.message)
  }
}
exports.refreshToken = async (req, res) => {
  const refreshToken = req.header('refreshToken')
  if (!refreshToken) return apiResponse.response_status(res, Languages.NOT_AUTHENTICATED, 401)
  if (!refreshTokens.includes(refreshToken)) return apiResponse.response_status(res, Languages.REFRES_TOKEN_NOT_VALID, 403)
  jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, (err, user) => {
    if (err) {
      return apiResponse.response_status(res, Languages.TOKEN_NOT_VALID, 403)
    } else {
      refreshTokens = refreshTokens.filter((token) => token !== refreshToken)
      const newAccessToken = jwt.sign({
        id: user.userId,
        role: user.role
      },
      process.env.JWT_ACCESS_KEY,
      { expiresIn: '60d' })
      const newRefreshToken = jwt.sign({
        id: user.userId,
        role: user.role
      },
      process.env.JWT_REFRESH_KEY,
      { expiresIn: '60d' })
      refreshTokens.push(refreshToken)
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: false,
        path: '/',
        sameSite: 'strict'
      })
      return apiResponse.response_token(res, Languages.SUCCESSFUL, newAccessToken, newRefreshToken)
    }
  })
}
exports.logout = async (req, res) => {
  refreshTokens = refreshTokens.filter((token) => token !== req.body.token)
  res.clearCookie('refreshToken')
  return apiResponse.response_status(res, Languages.LOGOUT_SUCCESSFUL, 200)
}
