const mongoose = require('mongoose')
const Joi = require('joi')

const Category = mongoose.model('Category', new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true, maxlength: 30 },
  idea: { type: [mongoose.Schema.Types.ObjectId], ref: 'Ideas' },
  totalIdea: { type: Number, default: 0 }
}, {
  timestamps: true
}))

function validateCategory (category) {
  const schema = Joi.object({
    name: Joi.string().max(30).required()
  })
  return schema.validate(category)
}

exports.Category = Category
exports.validate = validateCategory
