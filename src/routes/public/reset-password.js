const {
  forgotPassword,
  resetPassword
} = require('../../controllers').resetPassword;

module.exports = (router) => {
  router.post('/api/password/forgot', forgotPassword);
  router.post('/api/password/reset', resetPassword);
};
