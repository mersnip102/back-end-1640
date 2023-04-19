const apiResponse = require('../helpers/api.response.helper')
const Languages = require('../utils/languages')
const fs = require('fs')
const Joi = require('joi')
const getNextSequenceValue = require('../utils/icrement.db')
const { Ideas, validate } = require('../models/idea.model')
const Files = require('../models/file.model')
const { Category } = require('../models/category.model')
const path = require('path')
const { transporter, mailNewIdeaNotificationOptions } = require('../utils/sendEmail')
const { User } = require('../models/user.model')
const { Event } = require('../models/event.model')
const { Department } = require('../models/department.model')
const moment = require('moment')

function unlinkFile (file) {
  fs.unlink(file, function (err) {
    if (err) {
      console.log('Error deleting file:', err)
    } else {
      console.log(`File deleted successfully.${file}`)
    }
  })
}
async function sendIdeaQAC (department) {
  const qac = await User.find({ role: 3, department }).lean()
  const email = qac.map(user => user.email)
  if (email.length > 0) {
    transporter.sendMail(mailNewIdeaNotificationOptions(email))
  }
}
function removeElement (array, elem) {
  const index = array.indexOf(elem)
  if (index > -1) {
    array.splice(index, 1)
  }
}
function timeComment (diffMinutes) {
  let message
  if (diffMinutes < 1) {
    message = Languages.JUST_FINISHED
  } else if (diffMinutes === 1) {
    message = `${diffMinutes} minute ago`
  } else if (diffMinutes < 60) {
    message = `${diffMinutes} minutes ago`
  } else if (diffMinutes === 60) {
    message = `${Math.floor(diffMinutes / 60)} hour ago`
  } else if (diffMinutes < 1440) {
    message = `${Math.floor(diffMinutes / 60)} hours ago`
  } else if (diffMinutes === 1440) {
    message = `${Math.floor(diffMinutes / 1440)} day ago`
  } else if (diffMinutes < 10080) {
    message = `${Math.floor(diffMinutes / 1440)} days ago`
  } else {
    message = Languages.LONG_TIME
  }
  return message
}
function validateIdea (idea) {
  const schema = Joi.object({
    title: Joi.string().min(5).max(100),
    content: Joi.string().min(6).max(255),
    anonymous: Joi.bool()
  })
  return schema.validate(idea)
}

module.exports = {
  async createIdea (req, res) {
    const directoryFile = path.join(__dirname, '../../../upload/')
    const _id = req._userId
    const _departmentId = req._departmentId
    const listFile = req.listFile
    try {
      const { title, content, anonymous, categoryId, eventId, deadlineIdea } = req.body
      const resultValidate = validate(req.body)
      if (resultValidate.error) {
        if (listFile.length !== 0) {
          listFile.forEach(element => {
            unlinkFile(directoryFile + element)
          })
        }
        return apiResponse.response_status(res, resultValidate.error.message, 400)
      }
      const categoryValue = await Category.findOne({ id: categoryId }, '_id')
      if (!categoryValue) {
        if (listFile.length !== 0) {
          listFile.forEach(element => {
            unlinkFile(directoryFile + element)
          })
        }
        return apiResponse.response_status(res, Languages.CATEGORY_NOT_EXSITS, 400)
      }
      const eventValue = await Event.findOne({ id: eventId }, '_id')
      if (!eventValue) {
        return apiResponse.response_status(res, Languages.EVENT_NOT_EXSITS, 400)
      }
      const valueDealineIdea = new Date(deadlineIdea).getTime()
      const now = new Date().getTime()
      if (valueDealineIdea > now) {
        if (listFile.length !== 0) {
          listFile.forEach(element => {
            unlinkFile(directoryFile + element)
          })
        }
        return apiResponse.response_status(res, Languages.EVENT_EXPIRED, 400)
      }
      const id = await getNextSequenceValue('ideaId')
      let newIdea
      if (listFile.length > 0) {
        const fileId = await getNextSequenceValue('fileId')
        const fileResult = await Files.create({ id: fileId, file: listFile })
        newIdea = Ideas({ department: _departmentId, id, user: _id, title, content, anonymous, category: categoryValue._doc._id, file: fileResult._doc._id, event: eventValue._doc._id })
      } else {
        newIdea = Ideas({ department: _departmentId, id, user: _id, title, content, anonymous, category: categoryValue._doc._id, event: eventValue._doc._id })
      }
      await newIdea.save()
      await Event.findOneAndUpdate({ id: eventId }, { $push: { idea: newIdea._doc._id }, $inc: { totalIdea: 1 } }, { new: true })
      await Department.findOneAndUpdate({ _id: _departmentId }, { $push: { idea: newIdea._doc._id }, $inc: { totalIdea: 1 } }, { new: true })
      await Category.findOneAndUpdate({ _id: categoryValue._doc._id }, { $push: { idea: newIdea._doc._id }, $inc: { totalIdea: 1 } }, { new: true })
      sendIdeaQAC(_departmentId)
      return apiResponse.response_status(res, Languages.CREATE_IDEA_SUCCESS, 200)
    } catch (error) {
      if (listFile.length !== 0) {
        listFile.forEach(element => {
          unlinkFile(directoryFile + element)
        })
      }
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async paginationListIdea (req, res) {
    try {
      const { eventId, categoryId, departmentId, sort } = req.query
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 5
      const skip = (limit * page) - limit
      const userId = req.userId
      let sortIdea = { totalViews: -1 }
      if (sort === 'latest_idea') {
        sortIdea = { createAt: -1 }
      } else if (sort === 'latest_comments') {
        sortIdea = { latestComments: -1 }
      } else if (sort === 'popular_idea') {
        sortIdea = { popular: -1 }
      }
      let _categoryId
      let _eventId
      let _departmentId
      if (categoryId) {
        _categoryId = await Category.findOne({ id: categoryId })
      }
      if (eventId) {
        _eventId = await Event.findOne({ id: eventId })
      }
      if (departmentId) {
        _departmentId = await Department.findOne({ id: departmentId })
      }
      const _category = _categoryId && _categoryId._doc._id ? _categoryId._doc._id : null
      const _event = _eventId && _eventId._doc._id ? _eventId._doc._id : null
      const _department = _departmentId && _departmentId._doc._id ? _departmentId._doc._id : null
      const ideas = await Ideas.find({
        $and: [
          _category ? { category: _category } : {},
          _event ? { event: _event } : {},
          _department ? { department: _department } : {}
        ]
      }, { _id: 0, __v: 0 }).populate({
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
        select: 'id content file user isEdited likes createdAt anonymous totalLike',
        options: { sort: { createAt: -1 }, limit: 1 },
        populate: [
          { path: 'user', select: 'id userId fullName email avatar -_id' },
          { path: 'file', select: 'file -_id' }
        ]
      }).skip(skip).limit(limit).sort(sortIdea).lean()
      const listIdea = ideas.map((idea) => {
        const commentTime = new Date(idea.comment.createdAt)
        const diffMinutes = moment().diff(commentTime, 'minutes')
        const time = timeComment(diffMinutes)
        const isLikes = idea.likes && idea.likes.includes(`${userId}`)
        const files = idea.file ?? []
        const isDislikes = idea.dislikes && idea.dislikes.includes(`${userId}`)
        const comments = (idea.comment.length > 0)
          ? [{
              _id: idea.comment[0]._id,
              id: idea.comment[0].id,
              content: idea.comment[0].content,
              user: idea.comment[0].user,
              isEdited: idea.comment[0].isEdited,
              isLikes: idea.comment[0].likes?.includes(`${userId}`) ?? false,
              totalLike: idea.comment[0].totalLike,
              timeAgo: time,
              anonymous: idea.comment[0].anonymous
            }
            ]
          : []
        const users = {
          userId: idea.user.userId,
          fullName: idea.user.fullName,
          email: idea.user.email,
          department: idea.user.department,
          avatar: idea.user.avatar
        }
        const { likes, user, dislikes, comment, ...ideaWithoutLikesAndDislikes } = idea
        return {
          ...ideaWithoutLikesAndDislikes,
          user: users,
          isLikes,
          isDislikes,
          file: files,
          comment: comments
        }
      })
      const totalIdea = await Ideas.find().countDocuments()
      return apiResponse.response_data(res, Languages.SUCCESSFUL, 200, {
        listIdea,
        totalIdea
      })
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async updateIdea (req, res) {
    try {
      const ideaId = req.params.id
      const userId = req.userId
      const { title, content, anonymous } = req.body
      const validate = validateIdea(req.body)
      if (validate.error) {
        return apiResponse.response_status(res, validate.error.message, 400)
      }
      const user = await User.findOne({ userId }).lean()
      const idea = await Ideas.findOneAndUpdate({ id: ideaId, user: user._id }, { title, content, anonymous })
      if (idea == null) {
        return apiResponse.response_status(res, Languages.IDEA_NOT_FOUND, 400)
      }
      return apiResponse.response_status(res, Languages.SUCCESSFUL, 200)
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async deleteIdea (req, res) {
    try {
      const ideaId = req.params.id
      const userId = req.userId
      const user = await User.findOne({ userId }).lean()
      const idea = await Ideas.findOneAndDelete({ id: ideaId, user: user._id })
      if (idea == null) {
        return apiResponse.response_status(res, Languages.IDEA_NOT_FOUND, 400)
      }
      return apiResponse.response_status(res, Languages.SUCCESSFUL, 200)
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async likeIdea (req, res) {
    try {
      const userId = req.userId
      const ideaId = req.params.id
      const idea = await Ideas.findOne({ id: ideaId })
      if (idea == null) {
        return apiResponse.response_status(res, Languages.IDEA_NOT_FOUND, 400)
      }
      if (idea.likes.includes(userId)) {
        removeElement(idea.likes, userId)
        idea.totalLike -= 1
        await idea.save()
        return apiResponse.response_status(res, Languages.UNLIKE_IDEA_SUCCESSFULL, 200)
      }
      if (idea.dislikes.includes(userId)) {
        removeElement(idea.dislikes, userId)
        idea.totalDislike -= 1
      }
      idea.likes.push(userId)
      idea.totalLike += 1
      idea.totalViews += 1
      await idea.save()
      return apiResponse.response_status(res, Languages.LIKE_IDEA_SUCCESSFUL, 200)
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async dislikeIdea (req, res) {
    try {
      const userId = req.userId
      const ideaId = req.params.id
      const idea = await Ideas.findOne({ id: ideaId })
      if (idea == null) {
        return apiResponse.response_status(res, Languages.IDEA_NOT_FOUND, 400)
      }
      if (idea.dislikes.includes(userId)) {
        removeElement(idea.dislikes, userId)
        idea.totalDislike -= 1
        await idea.save()
        return apiResponse.response_status(res, Languages.UNDISLIKE_IDEA_SUCCESSFULL, 200)
      }
      if (idea.likes.includes(userId)) {
        removeElement(idea.likes, userId)
        idea.totalLike -= 1
      }
      idea.dislikes.push(userId)
      idea.totalDislike += 1
      idea.totalViews += 1
      await idea.save()
      return apiResponse.response_status(res, Languages.DISLIKE_IDEA_SUCCESSFUL, 200)
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async getIdeaById (req, res) {
    try {
      const userId = req.userId
      const id = req.params.id
      const idea = await Ideas.findOne({ id }, { _id: 0, __v: 0 }).populate({
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
      }).lean()
      if (idea == null) {
        return apiResponse.response_status(res, Languages.IDEA_NOT_FOUND, 400)
      }
      const data = {
        ...idea,
        isLikes: idea.likes.includes(`${userId}`),
        isDislikes: idea.dislikes.includes(`${userId}`)
      }
      return apiResponse.response_data(res, Languages.SUCCESSFUL, 200, data)
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  }
}
