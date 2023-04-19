const { Event, validate } = require('../models/event.model')
const apiResponse = require('../helpers/api.response.helper')
const Languages = require('../utils/languages')
const getNextSequenceValue = require('../utils/icrement.db')
const { Ideas } = require('../models/idea.model')

module.exports = {
  async createEvent (req, res) {
    try {
      const { name, deadlineIdea, deadlineComment } = req.body
      const userId = req.userId
      const result = validate(req.body)
      if (result.error) {
        return apiResponse.response_status(res, result.error.message, 400)
      }
      const event = await Event.findOne({ name })
      if (event != null) {
        return apiResponse.response_status(res, Languages.EVENT_EXSITS, 400)
      } else {
        const valueDealineIdea = new Date(deadlineIdea).getTime()
        const valueDeadlineComment = new Date(deadlineComment).getTime()
        const now = new Date().getTime()
        if (valueDealineIdea > now && valueDeadlineComment > valueDealineIdea) {
          const id = await getNextSequenceValue('eventId')
          const newEvent = new Event({ id, name, deadlineIdea, deadlineComment, userId })
          await newEvent.save()
          return apiResponse.response_data(res, Languages.EVENT_SUCCESS, 200, newEvent)
        } else {
          return apiResponse.response_status(res, Languages.EVENT_SET_TIME_FAIL, 400)
        }
      }
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async getListEvent (req, res) {
    try {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 5
      const skip = (limit * page) - limit
      const list = await Event.find({}, { _id: 0, __v: 0 }).skip(skip).limit(limit)
      if (list.error) {
        return apiResponse.response_status(res, list.error.message, 400)
      }
      const totalEvent = await Event.find().lean().countDocuments()
      return apiResponse.response_data(res, Languages.SUCCESSFUL, 200, {
        list,
        totalEvent
      })
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async updateEvent (req, res) {
    try {
      const { id, deadlineIdea, deadlineComment } = req.body
      validate(req.body)
      const event = await Event.findOne({ id })
      if (!event) {
        return apiResponse.response_status(res, Languages.EVENT_NOT_EXSITS, 400)
      } else {
        const valueDealineIdea = new Date(deadlineIdea).getTime()
        const valueDeadlineComment = new Date(deadlineComment).getTime()
        const startDateDB = new Date().getTime()
        if (valueDealineIdea > startDateDB && valueDeadlineComment > valueDealineIdea) {
          const id = await getNextSequenceValue('eventId')
          await Event.findOneAndUpdate(id, { $set: { deadlineIdea, deadlineComment } })
          return apiResponse.response_status(res, Languages.SUCCESSFUL, 200)
        } else {
          return apiResponse.response_status(res, Languages.EVENT_SET_TIME_FAIL, 400)
        }
      }
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async deleteEvent (req, res) {
    try {
      const id = req.params.id
      const event = await Event.findOneAndDelete({ id })
      if (event == null) {
        return apiResponse.response_status(res, Languages.EVENT_NOT_EXSITS, 400)
      }
      return apiResponse.response_status(res, Languages.EVENT_DELETE_SUCCESS, 200)
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async getEachEvent (req, res) {
    try {
      const id = req.params.id
      const event = await Event.findOne({ id }, { _id: 0, __v: 0 })
      if (event == null) {
        return apiResponse.response_status(res, Languages.EVENT_NOT_EXSITS, 400)
      }
      return apiResponse.response_data(res, Languages.SUCCESSFUL, 200, event)
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async getIdeaByEvent (req, res) {
    const id = parseInt(req.params.id) || 0
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (limit * page) - limit
    const event = await Event.findOne({ id }, { __v: 0 })
    if (event == null) {
      return apiResponse.response_status(res, Languages.EVENT_NOT_EXSITS, 400)
    }
    const listIdea = await Ideas.find({ event: event._doc._id }).populate({
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
    const totalIdea = await Ideas.find({ event: event._doc._id }).countDocuments()
    return apiResponse.response_data(res, Languages.SUCCESSFUL, 200, {
      listIdea,
      totalIdea
    })
  }
}
