const mongoose = require('mongoose')
const Joi = require('joi')

const Event = mongoose.model('Event', new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true, maxlength: 30 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  idea: { type: [mongoose.Schema.Types.ObjectId], ref: 'Ideas' },
  deadlineIdea: { type: String, required: true },
  deadlineComment: { type: String, required: true },
  totalIdea: { type: Number, default: 0 }
}, {
  timestamps: true
}))

function validateEvent (event) {
  const schema = Joi.object({
    name: Joi.string().max(30).required(),
    deadlineIdea: Joi.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/).required(),
    deadlineComment: Joi.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/).required()
  })
  return schema.validate(event)
}

exports.Event = Event
exports.validate = validateEvent
