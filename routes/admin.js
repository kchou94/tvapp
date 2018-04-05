/*===========
  * Admin! *
  * Routes!*
============*/
var express = require('express');
var router = express.Router();
if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config();
}

var User = require('../models/user');
var Email = require('../models/email');

/* INDEX */
router.get('/', isLoggedIn, isAdmin, function(req, res) {
  res.render('admin/index', {page: 'Admin'});
});

/* WHITELIST */
router.get('/whitelist', isLoggedIn, isAdmin, function(req, res) {
  Email.find({}, function(err, emailsFound){
    if(err){
      req.flash('error', err.message);
      return res.redirect('back');
    }
    User.find({}, function(err, usersFound){
      if(err){
        req.flash('error', err.message);
        return res.redirect('back');
      }
      res.render('admin/whitelist', {page: 'Admin | Whitelist', emails: emailsFound, users: usersFound});
    });    
  });
});

/* WHITELIST POST */
router.post('/whitelist', isLoggedIn, isAdmin, function(req, res){
  var email = req.body.email;
  console.log(req.body);
  Email.find({email: email}, function(err, emailsFound){
    if(emailsFound.length){
      req.flash('error', 'That email already exists!');
      res.redirect('back');
    } else {
      Email.create({email: email}, function(err){
        if(err){
          req.flash('error', err.message);
          return res.redirect('back');
        }
        req.flash('success', 'Added to whitelist!');
        res.redirect('back');
      });
    }
  });
});

/* WHITELIST DESTROY */
router.delete('/whitelist/:emailId', isLoggedIn, isAdmin, function(req, res){
  var emailId = req.params.emailId;
  Email.findByIdAndRemove(emailId, function(err){
    if(err){
      req.flash('error', err.message);
      return res.redirect('back');
    }
    req.flash('success', 'Removed from whitelist!');
    res.redirect('back');
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

function isAdmin(req, res, next){
  if(req.user.isAdmin){
    next();
  } else {
    req.flash('error', 'You don\'t have permission!');
    res.redirect('back');
  }
}

module.exports = router;
