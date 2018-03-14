/*===========
  * Shows! *
  * Routes!*
============*/

var express = require('express');
var router = express.Router();

/* INDEX */
router.get('/', function(req, res) {
  res.render('shows/index', {page: 'shows'});
});

module.exports = router;