const Joi = require('joi')
const mongoose = require('mongoose')

const User = mongoose.model('User', new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  firstName: { type: String, required: true, minlength: 1, maxlength: 50 },
  lastName: { type: String, required: true, minlength: 1, maxlength: 50 },
  fullName: { type: String, minlength: 1, maxlength: 100 },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  idea: [mongoose.Schema.Types.ObjectId],
  email: { type: String, required: true, minlength: 6, maxlength: 255, unique: true },
  password: { type: String, required: true, minlength: 6, maxlength: 255 },
  role: { type: Number, required: true },
  avatar: { type: String, default: 'default-avatar.png' },
  isActive: { type: Boolean, required: true, default: true }
}, { timestamps: true }))

function validateUser (user) {
  const schema = Joi.object({
    email: Joi.string().min(6).max(255).required().email(),
    password: Joi.string().pattern(/^[a-zA-Z0-9]{8,30}$/).required(),
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    department: Joi.string().required(),
    role: Joi.number().required()
  })
  return schema.validate(user)
}

exports.User = User
exports.validate = validateUser
