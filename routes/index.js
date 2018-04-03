/*===========
  * Index! *
  * Routes!*
============*/
var express = require('express');
var router = express.Router();
var passport = require('passport');

var User = require('../models/user');

/* INDEX */
router.get('/', function(req, res) {
  res.render('index', {page: 'home'});
});

/*==========
 User Routes 
============*/

/* Register */
router.get('/register', function(req, res){
  res.render('register', {page: 'Register'});
});

/* Register POST */
router.post('/register', function(req, res){
  var userData = {
    displayName: req.body.username,
    username: req.body.username,
    email: req.body.email
  }
  User.register(userData, req.body.password, function(err, userNew){
    if(err){
      req.flash('error', err.message);
      return res.redirect('/register');
    }
    // console.log('ok');
    req.login(userNew, function(err){
      if(err){ 
        req.flash('error', err.message);
        return res.redirect('back');
      }
      res.redirect('/shows');
    });
  });
});

/* Login GET */
router.get('/login', function(req, res){
  res.render('login', {page: 'Login'});
})

/* Login POST */
router.post('/login', passport.authenticate('local', {
  successRedirect: '/shows',
  failureRedirect: '/login',
  failureFlash: true,
  successFlash: 'Welcome back!'
}));

/* Logout */
router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/shows');
});

module.exports = router;
