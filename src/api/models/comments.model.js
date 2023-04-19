const mongoose = require('mongoose')
const Joi = require('joi')

const Comment = mongoose.model('Comment', new mongoose.Schema({
  id: { type: Number, required: true },
  idea: { type: mongoose.Schema.Types.ObjectId, ref: 'Ideas' },
  content: { type: String, maxlength: 10000, required: true },
  file: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isEdited: { type: Boolean, default: false },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  totalLike: { type: Number, default: 0 },
  anonymous: { type: Boolean, default: false }
}, {
  timestamps: true
}))

function validateComment (comment) {
  const schema = Joi.object({
    ideaId: Joi.number().required(),
    content: Joi.string().min(2).max(1000).required(),
    anonymous: Joi.bool(),
    commentId: Joi.number()
  })
  return schema.validate(comment)
}
exports.Comment = Comment
exports.validate = validateComment
