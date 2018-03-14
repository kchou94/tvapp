/*===========
  * Index! *
  * Routes!*
============*/
var express = require('express');
var router = express.Router();

/* INDEX */
router.get('/', function(req, res) {
  res.render('index', {page: 'Home'});
});

module.exports = router;
