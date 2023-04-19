const apiResponse = require('../helpers/api.response.helper')
const Languages = require('../utils/languages')
const fs = require('fs')
const getNextSequenceValue = require('../utils/icrement.db')
const Files = require('../models/file.model')
const { Comment, validate } = require('../models/comments.model')
const path = require('path')
const directoryFile = path.join(__dirname, '../../../upload/')
const moment = require('moment')
const { Ideas } = require('../models/idea.model')
const { transporter, mailNewIdeaCommentOptions } = require('../utils/sendEmail')
function unlinkFile (file) {
  fs.unlink(file, function (err) {
    if (err) {
      console.log(err)
    } else {
      console.log(`${file}`)
    }
  })
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

module.exports = {
  async createComment (req, res) {
    const listFile = req.listFile
    try {
      const fullName = req.fullName
      const userId = req.userId
      const _userId = req._userId
      const { ideaId, content, deadlineComment, anonymous } = req.body
      const resultValidate = validate(req.body)
      if (resultValidate.error) {
        if (listFile.length !== 0) {
          listFile.forEach(element => {
            unlinkFile(directoryFile + element)
          })
        }
        return apiResponse.response_status(res, resultValidate.error.message, 400)
      }
      const valueDeadlineComment = new Date(deadlineComment).getTime()
      const now = new Date().getTime()
      if (valueDeadlineComment > now) {
        if (listFile.length !== 0) {
          listFile.forEach(element => {
            unlinkFile(directoryFile + element)
          })
        }
        return apiResponse.response_status(res, Languages.EVENT_EXPIRED, 400)
      }
      const idea = await Ideas.findOne({ id: ideaId }).populate({ path: 'user', select: 'id userId fullName email avatar' })
      console.log(idea)
      if (!idea) {
        return apiResponse.response_status(res, Languages.IDEA_NOT_FOUND, 400)
      }
      if (listFile.length > 0) {
        const fileId = await getNextSequenceValue('fileId')
        const fileResult = await Files.create({ id: fileId, file: listFile })
        const id = await getNextSequenceValue('commentId')
        const comment = await new Comment({ idea: idea._doc._id, id, user: _userId, content, file: fileResult._doc._id, anonymous }).save()
        await Ideas.findOneAndUpdate({ id: ideaId }, { $inc: { totalComment: 1 }, $push: { comment: comment._id } },
          { new: true })
      } else {
        const id = await getNextSequenceValue('commentId')
        const comment = await new Comment({ idea: idea._doc._id, id, user: _userId, content, anonymous }).save()
        await Ideas.findOneAndUpdate({ id: ideaId }, { $inc: { totalComment: 1 }, $push: { comment: comment._id } },
          { new: true })
      }
      if (idea.user.userId !== userId) {
        transporter.sendMail(mailNewIdeaCommentOptions(idea.user.email, idea.user.fullName))
      }
      return apiResponse.response_status(res, Languages.CREATE_COMMENT_SUCCESS, 200)
    } catch (error) {
      if (listFile.length !== 0) {
        listFile.forEach(element => {
          unlinkFile(directoryFile + element)
        })
      }
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async listComment (req, res) {
    try {
      const _id = req._userId
      const ideaId = parseInt(req.query.ideaId)
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 5
      const skip = (limit * page) - limit
      const idea = await Ideas.findOne({ id: ideaId })
      const comments = await Comment.find({ idea: idea._doc._id }, {}).populate({ path: 'user', select: 'id userId fullName email avatar -_id' })
        .populate({ path: 'file', select: 'file -_id' }).skip(skip).limit(limit).lean()
      const listComment = comments.map(comment => {
        const commentTime = new Date(comment.createdAt)
        const diffMinutes = moment().diff(commentTime, 'minutes')
        const time = timeComment(diffMinutes)
        return {
          anonymous: comment.anonymous,
          id: comment.id,
          isLiked: comment.likes && comment.likes.includes(`${_id}`),
          content: comment.content,
          createdAt: comment.createAt,
          totalReply: comment.totalReply,
          isEdited: comment.isEdited,
          user: comment.user,
          totalLike: comment.totalLike,
          files: comment.file,
          timeAgo: time

        }
      })
      const totalComment = await Comment.find({ ideaId }).lean().countDocuments()
      return apiResponse.response_data(res, Languages.SUCCESSFUL, 200, {
        listComment,
        totalComment
      })
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async updateComment (req, res) {
    try {
      const { content, anonymous } = req.body
      const id = req.params.id
      const userId = req.userId

      const commentIsMyself = await Comment.findOne({ id, userId })
      if (commentIsMyself == null) {
        return apiResponse.response_status(res, Languages.COMMENT_NOT_YOUSELF, 400)
      }
      await Comment.findOneAndUpdate(id, { content, anonymous })
      return apiResponse.response_status(res, Languages.UPDATE_COMMENT_SUCCESS, 200)
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async deleteComment (req, res) {
    try {
      const userId = req.userId
      const _userId = req._userId
      const commentId = req.params.id
      const commentIsMyself = await Comment.findOne({ id: commentId }).populate({ path: 'user', select: 'userId' }).lean()
      if (commentIsMyself == null) {
        return apiResponse.response_status(res, commentIsMyself, 400)
      }
      if (commentIsMyself.user.userId !== userId) {
        return apiResponse.response_status(res, Languages.COMMENT_NOT_YOUSELF, 400)
      }
      await Comment.findOneAndDelete({ id: commentId, user: _userId })
      await Ideas.findOneAndUpdate({ id: commentId }, { $inc: { totalComment: -1 } },
        { new: true })
      return apiResponse.response_status(res, Languages.DELETE_COMMENT_SUCCESS, 200)
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  },
  async likeComment (req, res) {
    try {
      const _id = req._userId
      const commentId = req.params.id
      const comment = await Comment.findOne({ id: commentId })
      if (comment == null) {
        return apiResponse.response_status(res, Languages.COMMENT_NOT_FOUND, 400)
      }
      if (comment.likes.includes(_id)) {
        removeElement(comment.likes, _id)
        comment.totalLike -= 1
        await comment.save()
        return apiResponse.response_status(res, Languages.UNLIKE_COMMENT_SUCCESSFULL, 200)
      }
      comment.likes.push(_id)
      comment.totalLike += 1
      await comment.save()
      return apiResponse.response_status(res, Languages.LIKE_COMMENT_SUCCESSFULL, 200)
    } catch (error) {
      return apiResponse.response_error_500(res, error.message)
    }
  }
}
