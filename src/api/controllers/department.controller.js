const apiResponse = require('../helpers/api.response.helper')
const Languages = require('../utils/languages')
const getNextSequenceValue = require('../utils/icrement.db')
const { Department, validate } = require('../models/department.model')
const { User } = require('../models/user.model')

module.exports = {
  async createDepartment (req, res) {
    try {
      const { name } = req.body
      const result = validate(req.body)
      if (result.error) {
        return apiResponse.response_status(res, result.error.message, 400)
      }
      const department = await Department.findOne({ name })
      if (department) {
        return apiResponse.response_status(res, Languages.DEPARTMENT_EXSITS, 400)
      }
      const id = await getNextSequenceValue('departmentId')
      const newDepartment = new Department({ name, id })
      await newDepartment.save()
      return apiResponse.response_status(res, Languages.SUCCESSFUL, 200)
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async getListDepartment (req, res) {
    try {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 10
      const skip = (limit * page) - limit
      const list = await Department.find({}, { _id: 0, __v: 0 }).skip(skip).limit(limit)
      if (list.error) {
        return apiResponse.response_status(res, list.error.message, 400)
      }
      const totalDepartment = await Department.find().countDocuments()
      return apiResponse.response_data(res, Languages.SUCCESSFUL, 200, {
        list,
        totalDepartment
      })
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async deleteDepartment (req, res) {
    try {
      const id = req.params.id
      const userDepartment = await User.find({ departmentId: id })
      if (userDepartment != null) {
        return apiResponse.response_status(res, Languages.DEPARTMENT_NOT_DELETE, 404)
      }
      const department = await Department.findOneAndDelete({ id })
      if (department == null) {
        return apiResponse.response_status(res, Languages.DEPARTMENT_NOT_EXSITS, 400)
      }
      return apiResponse.response_status(res, Languages.DEPARTMENT_DELETE_SUCCESS, 200)
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async updateDepartment (req, res) {
    try {
      const id = req.params.id
      const name = req.body.name
      const department = await Department.findOneAndUpdate({ id }, { name })
      if (department == null) {
        return apiResponse.response_status(res, Languages.DEPARTMENT_NOT_EXSITS, 400)
      }
      return apiResponse.response_status(res, Languages.SUCCESSFUL, 200)
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async getEachDepartment (req, res) {
    try {
      const id = req.params.id
      const department = await Department.findOne({ id }, { _id: 1 })
      if (department == null) {
        return apiResponse.response_status(res, Languages.DEPARTMENT_NOT_EXSITS, 400)
      }
      return apiResponse.response_data(res, Languages.SUCCESSFUL, 200, department)
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  }
}
