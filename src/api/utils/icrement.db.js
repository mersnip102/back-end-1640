const Counter = require('../models/counter.model')

async function getNextSequenceValue (sequenceName) {
  const result = await Counter.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    { new: true })
  if (result == null) {
    const newValue = new Counter({
      _id: sequenceName,
      seq: 1
    })
    newValue.save()
    return newValue.seq
  } else {
    return result.seq
  }
}
module.exports = getNextSequenceValue
