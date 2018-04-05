/*===========
  * Index! *
  * Routes!*
============*/
var express = require('express');
var router = express.Router();
var passport = require('passport');
if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config();
}
var nodemailer = require('nodemailer');
var crypto = require('crypto');

var User = require('../models/user');
var Email = require('../models/email');
var Token = require('../models/token');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

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
  Email.findOne({'email': userData.email}, function(err, emailFound){
    if(err){
      req.flash('error', err.message);
      return res.redirect('back');
    }
    if(emailFound){
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
          var tokenGen = crypto.randomBytes(48).toString('base64').replace(/\//g,'_').replace(/\+/g,'-');
          Token.create({tokenStr: tokenGen, user: req.user._id}, function(err, tokenCreated){
            if(err){
              req.flash('error', err.message);
              return res.redirect('back');
            }            
            var msg = {
              to: userData.email,
              from: 'moemoeclubmailer@gmail.com',
              subject: 'Moe Moe Club - Welcome!  Please verify your account',
              text: 'Welcome to Moe Moe Club!  Please verify your account by going to: http://moemoeclub-kchou94.herokuapp.com/activate/' + tokenGen,
              html: '<h1>Welcome to Moe Moe Club!</h1><p>Please verify your account by clicking the link below</p><a href=\"http://moemoeclub-kchou94.herokuapp.com/activate/' + tokenGen + '\">Verify me kudasai!</a><p>If that doesn\'t work, copy and paste this into your browser address bar: http://moemoeclub-kchou94.herokuapp.com/activate/' + tokenGen + '</p>'
            };
            transporter.sendMail(msg, function(err, info){
              // if(err){
              //   return console.log(err);
              // }
              // console.log(info);
            });
            req.flash('success', 'Registered!');
            res.redirect('/activate');
          });
        });
      });
    } else {
      req.flash('error', 'You\'re not on the whitelist!');
      res.redirect('back');
    }
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

/* Activate */
router.get('/activate', isLoggedIn, isNotActive, function(req, res){
  res.render('activate/index');
});

/* Activation Email Send */
router.get('/activate/send', isLoggedIn, isNotActive, function(req, res){
  Token.findOne({user: req.user._id}, function(err, tokenFound){
    if(err){
      req.flash('error', err.message);
      return res.redirect('back');
    }
    // console.log(tokenFound.tokenStr);
    var msg = {
      to: req.user.email,
      from: 'moemoeclubmailer@gmail.com',
      subject: 'Moe Moe Club - Welcome!  Please verify your account',
      text: 'Welcome to Moe Moe Club!  Please verify your account by going to: http://moemoeclub-kchou94.herokuapp.com/activate/' + tokenFound.tokenStr,
      html: '<h1>Welcome to Moe Moe Club!</h1><p>Please verify your account by clicking the link below</p><a href=\"http://moemoeclub-kchou94.herokuapp.com/activate/' + tokenFound.tokenStr + '\">Verify me kudasai!</a><p>If that doesn\'t work, copy and paste this into your browser address bar: http://moemoeclub-kchou94.herokuapp.com/activate/' + tokenFound.tokenStr + '</p>'
    };
    transporter.sendMail(msg, function(err, info){
      if(err){
        req.flash('error', err.message);
        return res.redirect('back');
      }
      res.render('activate/send');
    });
  });
});

/* Activate Token */
router.get('/activate/:tokenStr', function(req, res){
  var tokenStr = req.params.tokenStr;
  Token.findOne({'tokenStr': tokenStr}, function(err, tokenFound){
    if(err){
      // console.log(err);
      req.flash('error', err.message);
      return res.redirect('/');
    }
    User.findById(tokenFound.user, function(err, userFound){
      if(err){
        req.flash('error', err.message);
        return res.redirect('/');
      }
      userFound.isActive = true;
      userFound.save(function(err){
        if(err){
          req.flash('error', err.message);
          return res.redirect('/');
        }
        tokenFound.remove(function(err){
          if(err){
            req.flash('error', err.message);
            return res.redirect('/');
          }
          req.flash('success', 'Thanks for verifying!');
          res.redirect('/');
        });
      });
    });
  });
});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    next();
  } else {
    req.flash('error', 'You must be logged in to do that!');
    res.redirect('/login');
  }
}

function isNotActive(req, res, next){
  if(!req.user.isActive){
    next();
  } else {
    req.flash('error', 'Your account is already active!');
    res.redirect('back');
  }
}

module.exports = router;
