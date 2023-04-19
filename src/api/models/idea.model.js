const mongoose = require('mongoose')
const Joi = require('joi')

const IdeasSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true, minlength: 3, maxlength: 150 },
  content: { type: String, required: true },
  anonymous: { type: Boolean, default: false },
  file: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comment: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  totalLike: { type: Number, default: 0 },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  totalDislike: { type: Number, default: 0 },
  totalComment: { type: Number, default: 0 },
  totalViews: { type: Number, default: 0 }
}, { timestamps: true })

IdeasSchema.virtual('popular', function () {
  return this.totalComment + this.totalViews
})

function validateIdeas (idea) {
  const schema = Joi.object({
    title: Joi.string().min(5).max(100).required(),
    content: Joi.string().min(6).max(255).required(),
    categoryId: Joi.number().min(1).max(50).required(),
    anonymous: Joi.bool().required(),
    eventId: Joi.number().min(1).max(50).required()
  })
  return schema.validate(idea)
}
const Ideas = mongoose.model('Ideas', IdeasSchema)

exports.Ideas = Ideas
exports.validate = validateIdeas
