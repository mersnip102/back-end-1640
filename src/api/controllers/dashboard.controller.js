const { User } = require('../models/user.model')
const { Event } = require('../models/event.model')
const { Department } = require('../models/department.model')
const { Category } = require('../models/category.model')
const { Ideas } = require('../models/idea.model')
const Languages = require('../utils/languages')
const apiResponse = require('../helpers/api.response.helper')

module.exports = {
  async ideaOfDepartmentOrCategory (req, res) {
    try {
      const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
      const year = '2023'
      const dataChartByMonth = []
      const dataDepartment = await Department.find({}, { _id: 0, user: 0, idea: 0, updatedAt: 0, __v: 0 }).lean()
      const dataCategory = await Category.find({}, { _id: 0, idea: 0, createdAt: 0, updatedAt: 0, __v: 0 }).lean()
      const dataUser = await User.find().lean().countDocuments()
      const dataTotalIdea = await Ideas.find().lean().countDocuments()
      const idea = await Ideas.aggregate([
        {
          $group: {
            _id: 0,
            totalLike: { $sum: '$totalLike' },
            totalDislike: { $sum: '$totalDislike' },
            totalComment: { $sum: '$totalComment' }
          }
        }
      ])
      for (const month of months) {
        const firstDay = new Date(`${year}-${month}-01T00:00:00.000Z`)
        const lastDay = new Date(`${year}-${month}-${new Date(year, month, 0).getDate()}T23:59:59.999Z`)
        const data = await Ideas.aggregate([
          {
            $match: {
              createdAt: {
                $gte: firstDay,
                $lte: lastDay
              }
            }
          },
          {
            $group: {
              _id: null,
              totalIdea: { $sum: 1 },
              totalLike: { $sum: '$totalLike' },
              totalDislike: { $sum: '$totalDislike' },
              totalComment: { $sum: '$totalComment' }
            }
          }
        ])
        dataChartByMonth.push(data)
      }
      const dataEvent = await Event.aggregate([
        {
          $lookup: {
            from: 'ideas',
            localField: 'idea',
            foreignField: '_id',
            as: 'ideas'
          }
        },
        {
          $project: {
            name: 1,
            totalIdea: 1,
            totalLike: {
              $sum: '$ideas.totalLike'
            },
            totalDislike: {
              $sum: '$ideas.totalDislike'
            },
            totalComment: {
              $sum: '$ideas.totalComment'
            }
          }
        }
      ])
      const totalLike = idea[0].totalLike
      const totalDislike = idea[0].totalDislike
      const totalComment = idea[0].totalComment
      const data = {
        department: dataDepartment,
        category: dataCategory,
        totalUser: dataUser,
        totalIdea: dataTotalIdea,
        totalLike,
        totalDislike,
        dataEvent,
        totalComment,
        dataChartByMonth
      }
      return apiResponse.response_data(res, Languages.SUCCESSFUL, 200, data)
    } catch (err) {
      return apiResponse.response_error_500(res, err.message)
    }
  }
}
