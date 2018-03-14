/*===========
  * Shows! *
  * Routes!*
============*/

var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var path = require('path');
var multer = require('multer');

var Show = require('../models/show');

var storage = multer.diskStorage({
  destination: 'public/uploads',
  filename: function(req, file, cb){
    crypto.randomBytes(16, function(err, buf){
      if (err) return console.log(err);
      cb(null, buf.toString('hex') + Date.now() + path.extname(file.originalname));
    })
  }
});
var upload = multer({storage: storage});

/* INDEX */
router.get('/', function(req, res) {
  Show.find({}, function(err, showsFound){
    if(err) return res.redirect('/back');
    res.render('shows/index', {page: 'shows', shows: showsFound});
  })
});

/* NEW */
router.get('/new', function(req, res){
  var show = Show.findOne()
  res.render('shows/new', {show : show});
});

/* CREATE */

router.post('/', upload.single('show[image]'), function(req, res){
  var showData = req.body.show;
  var tagArray = showData.tags.split(',');
  showData.tags = tagArray;
  newPath = req.file.path.substring(req.file.path.indexOf('public\\') + 7);
  console.log(newPath);
  showData.image = newPath;
  Show.create(showData, function(err, showCreated){
    if(err){
      console.log(err);
      return res.redirect('back');
    } 
    res.redirect('/shows');
  });
});

module.exports = router;