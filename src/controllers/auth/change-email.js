const { Op } = require('sequelize');
const { User } = require('../../models');
const { find } = require('../../middleware');
const { BadRequestError } = require('../../errors');
const resetToken = require('../../auth/reset-token');
const smtpTransport = require('../../email');

const {
  CONFIRM_EMAIL_URL,
  MAILGUN_EMAIL
} = process.env;

const changeEmail = async (req, res, next) => {
  try {
    const {
      body: {
        email,
        confirmEmail
      },
      user
    } = req;

    if (email !== confirmEmail) {
      throw new BadRequestError('The emails do not match');
    }

    const token = await resetToken();
    const expiryDate = new Date();

    // Set token expiration to 1 day from now
    expiryDate.setDate(expiryDate.getDate() + 1);

    await user.update({
      resetEmail: email,
      resetEmailToken: token,
      resetEmailTokenExpiry: expiryDate
    });

    const emailConfig = {
      to: email,
      from: MAILGUN_EMAIL,
      template: 'change-email',
      subject: 'Email Change Request',
      context: {
        url: `${CONFIRM_EMAIL_URL}${token}`,
        username: user.username
      }
    };

    await smtpTransport.sendMail(emailConfig);

    res.status(200).send();
  } catch (e) {
    next(e);
  }
};

const confirmEmail = [
  find({
    model: User,
    method: 'findOne',
    where: (req) => ({
      resetEmailToken: req.body.token,
      resetEmailTokenExpiry: {
        [Op.gt]: Date.now()
      }
    }),
    updateRequest: (req, data) => {
      req.user = data;
    },
    end: false
  }),
  async (req, res, next) => {
    try {
      const { user } = req;

      await user.update({
        email: user.resetEmail
      });

      await user.update({
        resetEmail: null,
        resetEmailToken: null,
        resetEmailTokenExpiry: null
      });

      const email = {
        to: user.email,
        from: MAILGUN_EMAIL,
        template: 'change-email-success',
        subject: 'Email Change Confirmation',
        context: {
          username: user.username
        }
      };

      await smtpTransport.sendMail(email);

      res.status(200).send({
        email: user.email
      });
    } catch (e) {
      next(e);
    }
  }
];

module.exports = {
  changeEmail,
  confirmEmail
};
