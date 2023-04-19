const { Category, validate } = require('../models/category.model')
const apiResponse = require('../helpers/api.response.helper')
const Languages = require('../utils/languages')
const getNextSequenceValue = require('../utils/icrement.db')
const { Ideas } = require('../models/idea.model')
const mongoose = require('mongoose')

module.exports = {
  async createCategory (req, res) {
    try {
      const { name } = req.body
      const result = validate(req.body)
      if (result.error) {
        return apiResponse.response_status(res, result.error.message, 400)
      }
      const category = await Category.findOne({ name })
      if (category) {
        return apiResponse.response_status(res, Languages.CATEGORY_EXSITS, 404)
      }
      const id = await getNextSequenceValue('categoryId')
      const newCategory = new Category({ name, id })
      await newCategory.save()
      return apiResponse.response_status(res, Languages.CATEGORY_SUCCESS, 200)
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async getListCategory (req, res) {
    try {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 10
      const skip = (limit * page) - limit
      const list = await Category.find({}, { _id: 0, __v: 0 }).skip(skip).limit(limit)
      if (list.error) {
        return apiResponse.response_status(res, list.error.message, 400)
      }
      const totalCategory = await Category.find().countDocuments()
      return apiResponse.response_data(res, Languages.SUCCESSFUL, 200, {
        list,
        totalCategory
      })
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async deleteCategory (req, res) {
    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        const categoryId = parseInt(req.params.id)
        const ideaCategory = await Ideas.find({ categoryId }).session(session)
        if (ideaCategory.length > 0) {
          return apiResponse.response_status(res, Languages.CATEGORY_HAS_IDEA, 400)
        }
        const deletedCategory = await Category.findOneAndDelete({ id: categoryId }).session(session)
        if (!deletedCategory) {
          return apiResponse.response_status(res, Languages.CATEGORY_NOT_EXSITS, 400)
        }
        return apiResponse.response_status(res, Languages.CATEGORY_DELETE_SUCCESS, 200)
      })
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    } finally {
      session.endSession()
    }
  },
  async getEachCategory (req, res) {
    try {
      const id = req.params.id
      const category = await Category.findOne({ id }, { _id: 0, __v: 0, user: 0 })
      if (category == null) {
        return apiResponse.response_status(res, Languages.CATEGORY_NOT_EXSITS, 400)
      }
      return apiResponse.response_data(res, Languages.SUCCESSFUL, 200, category)
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async listIdeaCategory (req, res) {
    try {
      const id = parseInt(req.params.id) || 0
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 10
      const skip = (limit * page) - limit
      const category = await Category.findOne({ id })
      if (category == null) {
        return apiResponse.response_status(res, Languages.CATEGORY_NOT_EXSITS, 400)
      }
      const ideas = await Ideas.find({ category: category._doc._id }).populate({
        path: 'user',
        select: 'userId fullName department email avatar -_id',
        populate: {
          path: 'department',
          select: 'id name _id'
        }
      }).populate({
        path: 'file',
        select: 'id file -_id'
      }).populate({
        path: 'event',
        select: 'id name deadlineIdea deadlineComment -_id'
      }).populate({
        path: 'category',
        select: 'id name -_id'
      }).populate({
        path: 'comment',
        select: 'id content file user isEdited likes totalLike',
        options: { sort: { createAt: -1 }, limit: 1 },
        populate: [
          { path: 'user', select: 'id userId fullName email avatar -_id' },
          { path: 'file', select: 'file -_id' }
        ]
      }).skip(skip).limit(limit)
      const totalIdea = await Ideas.find({ category: category._doc._id }).countDocuments()
      return apiResponse.response_data(res, Languages.SUCCESSFUL, 200, {
        ideas,
        totalIdea
      })
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  }
}
