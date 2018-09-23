const {
  changeEmail,
  confirmEmail
} = require('../../controllers').changeEmail;

const { requireLogin } = require('../../middleware');

module.exports = (router) => {
  router.post('/api/email/change', requireLogin, changeEmail);
  router.post('/api/email/confirm', confirmEmail);
};
