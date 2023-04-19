const mongoose = require('mongoose')
const Joi = require('joi')

const Department = mongoose.model('Department', new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true, maxlength: 30 },
  user: { type: [mongoose.Schema.Types.ObjectId] },
  idea: { type: [mongoose.Schema.Types.ObjectId], ref: 'Ideas' },
  totalIdea: { type: Number, default: 0 }
}, {
  timestamps: true
}))

function validateDepartment (department) {
  const schema = Joi.object({
    name: Joi.string().max(30).required()
  })
  return schema.validate(department)
}

exports.Department = Department
exports.validate = validateDepartment
