const nodemailer = require('nodemailer')
module.exports = {
  transporter: nodemailer.createTransport({
    host: 'smtp.gmail.com',
    service: 'gmail',
    port: 587,
    secure: false,
    auth: {
      user: 'greenwich.systems@gmail.com',
      pass: 'wwqntrteocofkjam'
    }
  }),
  mailCreatedAccountOptions: (email, password) => {
    return {
      from: 'greenwich.systems@gmail.com',
      to: email,
      subject: 'Staff Account Created',
      text: `Your user account has been created! /n You can login account with account is your email and password is "${password}"`
    }
  },
  mailNewIdeaNotificationOptions: (email) => {
    return {
      from: 'greenwich.systems@gmail.com',
      to: email,
      subject: 'Staff created new idea',
      text: "Dear Quality Assurance Coordinator. There's a staff member who just uploaded an idea"
    }
  },
  mailNewIdeaCommentOptions: (email, name) => {
    return {
      from: 'greenwich.systems@gmail.com',
      to: email,
      subject: 'New Comment',
      text: `${name} commented on your idea. Confirm it with him.`
    }
  }
}
