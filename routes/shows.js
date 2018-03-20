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

/*===========
Index Routes
============*/

/* INDEX */
router.get('/', function(req, res) {
  Show.find({}, function(err, showsFound){
    if(err) return res.redirect('back');
    res.render('shows/index', {page: 'shows', shows: showsFound});
  })
});

/* NEW */
router.get('/new', function(req, res){
  res.render('shows/new');
});

/* CREATE */

router.post('/', upload.single('show[image]'), function(req, res){
  var showData = req.body.show;
  showData.description = undefined;
  if(showData.tags === ''){
    showData.tags = undefined;
  } else {
    var tagArray = showData.tags.split(',');
    showData.tags = tagArray;
  }
  newPath = req.file.path.substring(req.file.path.indexOf('public\\') + 7);
  showData.image = newPath;
  Show.create(showData, function(err, showCreated){
    if(err){
      console.log(err);
      return res.redirect('back');
    } 
    res.redirect('/shows');
  });
});

/* SHOW */
router.get('/:id', function(req, res) {
  Show.findById(req.params.id, function(err, showFound){
    if(err) return res.redirect('back');
    res.render('shows/show', {show: showFound});
  });
});

/*===========
Season Routes
============*/

/* NEW */
router.get('/:id/seasons/new', function(req, res){
  var id = req.params.id;
  Show.findById(id, function(err, showFound){
    if(err) return res.redirect('back');
    res.render('shows/seasons/new', {show: showFound});
  });
});

/* CREATE */
router.post('/:id/seasons', function(req, res){
  var id = req.params.id;
  var seasonData = req.body.season;
  // console.log(seasonData);
  Show.findById(id, function(err, showFound){
    if(err) return res.redirect('back');
    showFound.seasons.push(seasonData);
    console.log(showFound);
    showFound.save(function(err){
      if(err) return res.redirect('back');
      res.redirect('/shows/' + showFound.id);
    });
  });
});

/* EDIT */
router.get('/:showId/seasons/:seasonId/edit', function(req, res){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  // console.log(seasonId);
  Show.findById(showId, function(err, showFound){
    if(err) return res.redirect('back');
    var season = showFound.seasons.id(seasonId);
    // console.log(season);
    res.render('shows/seasons/edit', {show: showFound, season: season});
  });
});

/* UPDATE */
router.put('/:showId/seasons/:seasonId', function(req, res){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  var seasonData = req.body.season;
  Show.findOneAndUpdate({'_id': showId, 'seasons._id': seasonId}, {'$set': {'seasons.$': seasonData}}, function(err, showUpdated){
    if(err){
      // console.log(err); 
      return res.redirect('back');
    }
    // console.log(showUpdated);
    res.redirect('/shows/' + showUpdated.id);
  });
});

module.exports = router;