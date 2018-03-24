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
Show Routes
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
  var tagStr = showData.tags;
  if(tagStr === ''){
    showData.tags = [];
  } else {
    showData.tags = tagStr.split(',');
  }
  newPath = req.file.path.substring(req.file.path.indexOf('public\\') + 7);
  showData.image = newPath;
  Show.create(showData, function(err, showCreated){
    if(err){
      // console.log(err);
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

/* EDIT */
router.get('/:id/edit', function(req, res){
  Show.findById(req.params.id, function(err, showFound){
    if(err){
      // console.log(err);
      return res.redirect('back');
    }
    // console.log(showFound);
    res.render('shows/edit', {show: showFound});
  });
});

/* UPDATE */

router.put('/:id', upload.single('show[image]'), function(req, res){
  var showData = req.body.show;
  var tagStr = showData.tags;
  // console.log('desc: ' + showData.description);
  // console.log('before: ' + showData.tags);
  if(tagStr === ''){
    showData.tags = [];
  } else {
    showData.tags = tagStr.split(',');
  }
  // console.log('after: ' + showData.tags);
  // console.log(req.file);
  if(req.file){
    newPath = req.file.path.substring(req.file.path.indexOf('public\\') + 7);
    showData.image = newPath;
  }
  Show.findByIdAndUpdate(req.params.id, showData, function(err, showUpdated){
    if(err){
      // console.log(err);
      return res.redirect('back');
    }
    // console.log(showUpdated);
    res.redirect('/shows/' + showUpdated._id);
  });
});

/* DESTROY */
router.delete('/:id', function(req, res){
  Show.findByIdAndRemove(req.params.id, function(err){
    if(err){
      // console.log(err);
      return res.redirect('back');
    }
    res.redirect('/shows');
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
    // console.log(showFound);
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
    res.redirect('/shows/' + showUpdated._id);
  });
});

/* DESTROY */
router.delete('/:showId/seasons/:seasonId', function(req, res){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  Show.findByIdAndUpdate(showId, {$pull: {seasons: {'_id': seasonId}}}, function(err, affected){
    if(err){
      // console.log(err); 
      return res.redirect('back');
    }
    // console.log(affected);
    res.redirect('/shows/' + showId);
  });
});

/*===========
 Video Routes
============*/

/* NEW */
router.get('/:showId/seasons/:seasonId/videos/new', function(req, res){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  Show.findById(showId, function(err, showFound){
    if(err){
      console.log(err);
      res.redirect('back');
    }
    var season = showFound.seasons.id(seasonId);
    res.render('shows/seasons/videos/new', {show: showFound, season: season});
  });
});

/* CREATE */
router.post('/:showId/seasons/:seasonId/videos', function(req, res){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  var videoData = req.body.video;
  videoData.url = videoData.url.replace(/^(.*?)streamable\.com[/\\]/, '//www.streamable.com/o/');
  videoData.thumbnail = videoData.url.replace(/^(.*?)streamable\.com\/o\//, '//images.streamable.com/east/image/') + '.jpg?height=200';
  Show.findById(showId, function(err, showFound){
    if(err){
      // console.log(err);
      return res.redirect('back');
    }
    var season = showFound.seasons.id(seasonId);
    season.videos.push(videoData);
    showFound.save(function(err){
      if(err){
        // console.log(err);
        res.redirect('back');
      }
      // console.log(season);
      res.redirect('/shows/' + showId);
    });
  });
});

/* EDIT */
router.get('/:showId/seasons/:seasonId/videos/:videoId/edit', function(req, res){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  var videoId = req.params.videoId;
  Show.findById(showId, function(err, showFound){
    if(err){
      console.log(err);
      res.redirect('back');
    }
    var season = showFound.seasons.id(seasonId);
    var video = season.videos.id(videoId);
    console.log(video);
    res.render('shows/seasons/videos/edit', {show: showFound, season: season, video: video});
  });
});

/* UPDATE */
router.put('/:showId/seasons/:seasonId/videos/:videoId', function(req, res){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  var videoId = req.params.videoId;
  var videoData = req.body.video;
  var urlVideo = videoData.url;
  var regexVideo = /^(.*?)streamable\.com\/o\//
  // console.log(videoData);
  Show.findById(showId, function(err, showFound){
    if(err){
      // console.log('oops: ' + err);
      res.redirect('back');
    }
    var season = showFound.seasons.id(seasonId);
    var video = season.videos.id(videoId);
    // console.log(urlVideo);
    if(!regexVideo.test(urlVideo)){
      urlVideo = urlVideo.replace(/^(.*?)streamable\.com[/\\]/, '//www.streamable.com/o/');
      videoData.url = urlVideo;
      videoData.thumbnail = urlVideo.replace(/^(.*?)streamable\.com\/o\//, '//images.streamable.com/east/image/') + '.jpg?height=200';
    }
    video.set(videoData);
    showFound.save(function(err){
      if(err){
        // console.log('error: ' + err);
        res.redirect('back');
      }
      res.redirect('/shows/' + showId);
    });
  });
});

/* DESTROY */


module.exports = router;