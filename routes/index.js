/*===========
  * Index! *
  * Routes!*
============*/
var express = require('express');
var router = express.Router();

var User = require('../models/user');

/* INDEX */
router.get('/', function(req, res) {
  res.render('index', {page: 'home'});
});

/* User Routes */


module.exports = router;
