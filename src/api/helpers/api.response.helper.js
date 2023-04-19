module.exports = {
  response_status: function (res, msg, status) {
    const data = {
      status,
      message: msg
    }
    return res.status(status).json(data)
  },
  response_data: function (res, msg, status, data) {
    const datas = {
      status,
      message: msg,
      data
    }
    return res.status(status).json(datas)
  },
  response_error_500: function (res, msg) {
    const data = {
      status: 500,
      message: msg
    }
    return res.status(500).json(data)
  },
  notFoundResponse: function (res, msg) {
    const data = {
      status: 404,
      message: msg
    }
    return res.status(404).json(data)
  },
  response_token: function (res, msg, accessToken, refreshToken) {
    const data = {
      status: 200,
      message: msg,
      accessToken,
      refreshToken
    }
    return res.status(200).json(data)
  }

}
