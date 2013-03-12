/**
 * Module dependencies.
 */
var passport = require('passport')
  , login = require('connect-ensure-login'),
    oauth = require('./oauth');


exports.index = function(req, res) {
  //res.send('OAuth-server');

   res.render('index');
};


exports.login = passport.authenticate('local', { successReturnToOrRedirect: '/', failureRedirect: '/login' });


exports.loginForm = function(req, res) {
    res.render('login');
};
exports.logout = function(req, res) {
  req.logout();
  res.redirect('/');
}

exports.account = [
  login.ensureLoggedIn(),
  function(req, res) {
    res.render('account', { user: req.user });
  }
]
