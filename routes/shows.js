/*===========
  * Shows! *
  * Routes!*
============*/

var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var path = require('path');
var cloudinary = require('cloudinary');
var cloudinaryStorage = require('multer-storage-cloudinary');
var multer = require('multer');
var createDOMPurify = require('dompurify');
var {JSDOM} = require('jsdom');
if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config();
}

var window = (new JSDOM('')).window;
var DOMPurify = createDOMPurify(window);

var Show = require('../models/show');

var storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: process.env.CLOUDINARY_FOLDER,
  filename: function(req, file, cb){
    crypto.randomBytes(16, function(err, buf){
      cb(null, buf.toString('hex') + Date.now());
    })
  }
});

// var storage = multer.diskStorage({
//   destination: 'public/uploads',
//   filename: function(req, file, cb){
//     crypto.randomBytes(16, function(err, buf){
//       if (err) return console.log(err);
//       cb(null, buf.toString('hex') + Date.now() + path.extname(file.originalname));
//     })
//   }
// });
var upload = multer({storage: storage});

/*===========
Show Routes
============*/

/* INDEX */
router.get('/', function(req, res) {
  Show.find({}, function(err, showsFound){
    if(err){
      req.flash('error', err.message);
      return res.redirect('back');
    }
    // console.log(showsFound);
    res.render('shows/index', {page: 'Shows', shows: showsFound});
  })
});

/* NEW */
router.get('/new', isLoggedIn, isActive, function(req, res){
  res.render('shows/new', {page: 'Add Show'});
});

/* CREATE */

router.post('/', isLoggedIn, isActive, upload.single('show[image]'), function(req, res){
  var showData = req.body.show;
  var tagStr = showData.tags;
  showData.description = DOMPurify.sanitize(showData.description, {
    SAFE_FOR_TEMPLATES: true
  });
  showData.author = req.user._id;
  if(tagStr === ''){
    showData.tags = [];
  } else {
    showData.tags = tagStr.split(',');
  }
  if(req.file){
    var imgAPI = req.file;
    showData.image = imgAPI.secure_url;
    showData.thumbnail = cloudinary.url(imgAPI.public_id + '.' + imgAPI.format, {secure: true, height: 400});
  }
  Show.create(showData, function(err, showCreated){
    if(err){
      req.flash('error', err.message);
      return res.redirect('back');
    } 
    res.redirect('/shows');
  });
});

// router.post('/', upload.single('show[image]'), function(req, res){
//   var showData = req.body.show;
//   var tagStr = showData.tags;
//   if(tagStr === ''){
//     showData.tags = [];
//   } else {
//     showData.tags = tagStr.split(',');
//   }
//   var newPath = req.file.path.substring(req.file.path.indexOf('public\\') + 7);
//   showData.image = newPath;
//   Show.create(showData, function(err, showCreated){
//     if(err){
//       // console.log(err);
//       return res.redirect('back');
//     } 
//     res.redirect('/shows');
//   });
// });

/* SHOW */
router.get('/:showId', function(req, res) {
  Show.findById(req.params.showId).populate('author').exec(function(err, showFound){
    if(err){
      req.flash('error', err.message);
      return res.redirect('back');
    }
    res.render('shows/show', {show: showFound, page: showFound.title});
  });
});

/* EDIT */
router.get('/:showId/edit', isLoggedIn, isActive, isShowAuthor, function(req, res){
  Show.findById(req.params.showId, function(err, showFound){
    if(err){
      req.flash('error', err.message);
      return res.redirect('back');
    }
    // console.log(showFound);
    res.render('shows/edit', {show: showFound, page: showFound.title + ' | Edit Show'});
  });
});

/* UPDATE */

router.put('/:showId', isLoggedIn, isActive, isShowAuthor, upload.single('show[image]'), function(req, res){
  var showId = req.params.showId;
  var showData = req.body.show;
  var tagStr = showData.tags;
  showData.description = DOMPurify.sanitize(showData.description, {
    SAFE_FOR_TEMPLATES: true,
  });
  // console.log('desc: ' + showData.description);
  // console.log('before: ' + showData.tags);
  if(tagStr === ''){
    delete showData.tags;
  } else {
    showData.tags = tagStr.split(',');
  }
  // console.log('after: ' + showData.tags);
  // console.log(req.file);
  if(req.file){
    var imgAPI = req.file;
    showData.image =  imgAPI.secure_url;
    showData.thumbnail = cloudinary.url(imgAPI.public_id + '.' + imgAPI.format, {secure: true, height: 400});
    // newPath = req.file.path.substring(req.file.path.indexOf('public\\') + 7);
    // showData.image = newPath;
  }
  Show.findByIdAndUpdate(showId, showData, function(err, showUpdated){
    if(err){
      req.flash('error', err.message);
      return res.redirect('back');
    }
    var imgToDeleteURL = showUpdated.image;
    var regex = new RegExp('^(.*?)res\\.cloudinary\\.com\\/' + process.env.CLOUDINARY_NAME + '\/(.*?)\/(' + process.env.CLOUDINARY_FOLDER + '\/(.*?))\\.(.*)');
    var imgToDeleteMatches = imgToDeleteURL.match(regex);
    cloudinary.v2.uploader.destroy(imgToDeleteMatches[3], function(error, result){
      if(error){
        // console.log(error);
        return
      }
      // console.log(result);
    });
    // console.log(showUpdated);
    res.redirect('/shows/' + showId);
  });
});

/* DESTROY */
router.delete('/:showId', isLoggedIn, isActive, isShowAuthor, function(req, res){
  Show.findByIdAndRemove(req.params.showId, function(err, showRemoved){
    if(err){
      // console.log(err);
      req.flash('error', err.message);
      return res.redirect('back');
    }
    var showImage = showRemoved.image;
    var regex = new RegExp('^(.*?)res\\.cloudinary\\.com\\/' + process.env.CLOUDINARY_NAME + '\/(.*?)\/(' + process.env.CLOUDINARY_FOLDER + '\/(.*?))\\.(.*)');
    var showImageMatches = showImage.match(regex);
    cloudinary.v2.uploader.destroy(showImageMatches[3], function(error, result){
      if(error){
        // console.log(error);
        return
      }
      // console.log(result);
    });
    // console.log(showRemoved);
    showRemoved.seasons.forEach(function(season){
      // console.log('- ' + season.name);
      season.images.forEach(function(image){
        // console.log('-- ' + image.description);
        var imageMatches = image.url.match(regex);
        // console.log('--- publicId: ' + imageMatches[3]);
        cloudinary.v2.uploader.destroy(imageMatches[3], function(error, result){
          if(error){
            // console.log(error);
            return
          }
          // console.log(result);
        });
      });      
    });
    // console.log('done');
    res.redirect('/shows');
  });
});

/* SHOW LIKES */

/* CREATE */
router.post('/:showId/like', isLoggedIn, isActive, function(req, res){
  var showId = req.params.showId;
  var user = req.user;
  Show.findById(showId, function(err, showFound){
    if(err){
      req.flash('error', err.message);
      return res.redirect('back');
    }
    var likeArr = showFound.likes;
    var userData = {
      username: user.displayName,
      user: user._id
    }
    likeArr.push(userData);
    showFound.save( function(err){
      if(err){
        req.flash('error', err.message);
        return res.redirect('back');
      }
      var refData = {
        kind: 'Show',
        item: showFound._id
      }
      user.likes.push(refData);
      user.save(function(err){
        if(err){
          req.flash('error', err.message);
          return res.redirect('back');
        }
        res.redirect('back');
      });
    });    
  });
});

/* DESTROY */
router.delete('/:showId/like/:userId', isLoggedIn, isActive, isUserId, function(req, res){
  var showId = req.params.showId;
  var userId = req.params.userId;
  Show.findById(showId, function(err, showFound){
    if(err){
      req.flash('error', err.message);
      return res.redirect('back');
    }
    var likes = showFound.likes;
    var likeIndex;
    for(var i = 0; i < likes.length; i++){
      if(likes[i].user == userId){
        likeIndex = i;
        break
      }
    }
    if(typeof likeIndex){
      likes.splice(likeIndex, 1);
      showFound.save(function(err){
        if(err){
          req.flash('error', err.message);
          res.redirect('back');
        }
        var userLikes = req.user.likes;
        var userLikesIndex;
        for(var i = 0; i < userLikes.length; i++){
          if(userLikes[i].item == showId){
            userLikesIndex = i;
            break
          }
        }
        if(typeof userLikesIndex){
          userLikes.splice(userLikesIndex, 1);
          req.user.save(function(err){
            if(err){
              req.flash('error', err.message);
              return res.redirect('back');
            }
            res.redirect('back');
          })
        } else {
          req.flash('error', 'Could not find your like in user document!');
          res.redirect('back');
        }        
      });
    } else {
      req.flash('error', 'Could not find your like in show document!');
      res.redirect('back');
    }
  })
});

/*===========
Season Routes
============*/

/* NEW */
router.get('/:showId/seasons/new', isLoggedIn, isActive, function(req, res){
  Show.findById(req.params.showId, function(err, showFound){
    if(err) return res.redirect('back');
    res.render('shows/seasons/new', {show: showFound, page: showFound.title + ' | Add Season'});
  });
});

/* CREATE */
router.post('/:showId/seasons', isLoggedIn, isActive, function(req, res){
  var showId = req.params.showId;
  var seasonData = req.body.season;
  seasonData.author = req.user._id;
  // console.log(seasonData);
  Show.findById(showId, function(err, showFound){
    if(err){
      req.flash('error', err.message);
      return res.redirect('back');
    } 
    showFound.seasons.push(seasonData);
    // console.log(showFound);
    showFound.save(function(err){
      if(err){
        req.flash('error', err.message);
        return res.redirect('back');
      }
      res.redirect('/shows/' + showId);
    });
  });
});

/* EDIT */
router.get('/:showId/seasons/:seasonId/edit', isLoggedIn, isActive, isSeasonAuthor, function(req, res){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  // console.log(seasonId);
  Show.findById(showId, function(err, showFound){
    if(err){
      req.flash('error', err.message);
      return res.redirect('back');
    }
    var season = showFound.seasons.id(seasonId);
    // console.log(season);
    res.render('shows/seasons/edit', {show: showFound, season: season, page: showFound.title + ' | Edit Season: ' + season.name});
  });
});

/* UPDATE */
router.put('/:showId/seasons/:seasonId', isLoggedIn, isActive, isSeasonAuthor, function(req, res){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  var seasonData = req.body.season;
  Show.findOneAndUpdate({'_id': showId, 'seasons._id': seasonId}, {'$set': {'seasons.$': seasonData}}, function(err, showUpdated){
    if(err){
      req.flash('error', err.message); 
      return res.redirect('back');
    }
    // console.log(showUpdated);
    res.redirect('/shows/' + showUpdated._id);
  });
});

/* DESTROY */
router.delete('/:showId/seasons/:seasonId', isLoggedIn, isActive, isSeasonAuthor, function(req, res){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  Show.findByIdAndUpdate(showId, {$pull: {seasons: {'_id': seasonId}}}, function(err, showUpdated){
    if(err){
      req.flash('error', err.message);
      return res.redirect('back');
    }
    // console.log(showUpdated.seasons.id(seasonId).images);
    res.redirect('/shows/' + showId);
  });
});

/*===========
 Video Routes
============*/

/* NEW */
router.get('/:showId/seasons/:seasonId/videos/new', isLoggedIn, isActive, function(req, res){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  Show.findById(showId, function(err, showFound){
    if(err){
      req.flash('error', err.message);
      res.redirect('back');
    }
    var season = showFound.seasons.id(seasonId);
    res.render('shows/seasons/videos/new', {show: showFound, season: season, page: showFound.title + ' | Add Video'});
  });
});

/* CREATE */
router.post('/:showId/seasons/:seasonId/videos', isLoggedIn, isActive, function(req, res){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  var videoData = req.body.video;
  videoData.author = req.user._id;
  videoData.url = videoData.url.replace(/^(.*?)streamable\.com\//, 'https://www.streamable.com/o/');
  videoData.thumbnail = videoData.url.replace(/^(.*?)streamable\.com\/o\//, 'https://images.streamable.com/east/image/') + '.jpg?height=200';
  Show.findById(showId, function(err, showFound){
    if(err){
      req.flash('error', err.message);
      return res.redirect('back');
    }
    var season = showFound.seasons.id(seasonId);
    season.videos.push(videoData);
    showFound.save(function(err){
      if(err){
        req.flash('error', err.message);
        res.redirect('back');
      }
      // console.log(season);
      res.redirect('/shows/' + showId);
    });
  });
});

/* EDIT */
router.get('/:showId/seasons/:seasonId/videos/:videoId/edit', isLoggedIn, isActive, isVideoAuthor, function(req, res){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  var videoId = req.params.videoId;
  Show.findById(showId, function(err, showFound){
    if(err){
      req.flash('error', err.message);
      res.redirect('back');
    }
    var season = showFound.seasons.id(seasonId);
    var video = season.videos.id(videoId);
    // console.log(video);
    res.render('shows/seasons/videos/edit', {show: showFound, season: season, video: video, page: showFound.title + ' | Edit Video: ' + video.description});
  });
});

/* UPDATE */
router.put('/:showId/seasons/:seasonId/videos/:videoId', isLoggedIn, isActive, isVideoAuthor, function(req, res){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  var videoId = req.params.videoId;
  var videoData = req.body.video;
  var urlVideo = videoData.url;
  var regexVideo = /https\:\/\/www\.streamable\.com\/o\/[a-zA-Z0-9]*/
  // console.log(videoData);
  Show.findById(showId, function(err, showFound){
    if(err){
      req.flash('error', err.message);
      res.redirect('back');
    }
    var season = showFound.seasons.id(seasonId);
    var video = season.videos.id(videoId);
    // console.log(urlVideo);
    if(!regexVideo.test(urlVideo)){
      urlVideo = urlVideo.replace(/^(.*?)streamable\.com[\/](o\/)?/, 'https://www.streamable.com/o/');
      videoData.url = urlVideo;
      videoData.thumbnail = urlVideo.replace(/^(.*?)streamable\.com\/o\//, 'https://images.streamable.com/east/image/') + '.jpg?height=200';
    }
    video.set(videoData);
    showFound.save(function(err){
      if(err){
        req.flash('error', err.message);
        res.redirect('back');
      }
      res.redirect('/shows/' + showId);
    });
  });
});

/* DESTROY */
router.delete('/:showId/seasons/:seasonId/videos/:videoId', isLoggedIn, isActive, isVideoAuthor, function(req, res){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  var videoId = req.params.videoId;
  Show.findById(showId, function(err, showFound){
    if(err){
      req.flash('error', err.message);
      res.redirect('back');
    }
    var season = showFound.seasons.id(seasonId);
    var videoArr = season.videos;
    var videoIndex;
    // console.log('season: ' + season);
    // console.log('videos: ' + season.videos);
    for(var i = 0; i < videoArr.length; i++){
      if(videoArr[i]._id == videoId){
        videoIndex = i;
        // console.log('matching index: ' + videoIndex);
        break
      }
      // console.log('skipped index: ' + i);
    }
    if(typeof videoIndex){
      videoArr.splice(videoIndex, 1);
      // console.log('after delete: ' + season);
      showFound.save(function(err){
        // console.log('saved');
        res.redirect('/shows/' + showId);
      })
    } else {
      // console.log('err: not found!');
      res.redirect('back');
    }  
  });
});

/*============
 Image Routes
=============*/

/* NEW */
router.get('/:showId/seasons/:seasonId/images/new', isLoggedIn, isActive, function(req, res){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  Show.findById(showId, function(err, showFound){
    if(err){
      req.flash('error', err.message);
      res.redirect('back');
    }
    var season = showFound.seasons.id(seasonId);
    res.render('shows/seasons/images/new', {show: showFound, season: season, page: showFound.title + ' | Add Image'});
  });
});

/* CREATE */
router.post('/:showId/seasons/:seasonId/images', isLoggedIn, isActive, upload.single('img[upload]'), function(req, res){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  var imgData = req.body.img;
  imgData.author = req.user._id;
  var imgAPI = req.file;
  imgData.url = imgAPI.secure_url;
  imgData.thumbnail = cloudinary.url(imgAPI.public_id + '.' + imgAPI.format, {secure: true, height: 200});
  // console.log(imgData);
  Show.findById(showId, function(err, showFound){
    if(err){
      req.flash('error', err.message);
      return res.redirect('back');
    }
    var season = showFound.seasons.id(seasonId);
    season.images.push(imgData);
    showFound.save(function(err){
      if(err){
        req.flash('error', err.message);
        return res.redirect('back');
      }
      return res.redirect('/shows/' + showId);
    });
  });
});

/* EDIT */
router.get('/:showId/seasons/:seasonId/images/:imageId/edit', isLoggedIn, isActive, isImageAuthor, function(req, res){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  var imageId = req.params.imageId;
  Show.findById(showId, function(err, showFound){
    if(err){
      req.flash('error', err.message);
      res.redirect('back');
    }
    var season = showFound.seasons.id(seasonId);
    var image = season.images.id(imageId);
    // console.log(image);
    res.render('shows/seasons/images/edit', {show: showFound, season: season, image: image, page: showFound.title + ' | Edit Image: ' + image.description});
  });
});

/* UPDATE */
router.put('/:showId/seasons/:seasonId/images/:imageId', isLoggedIn, isActive, isImageAuthor, upload.single('img[upload]'), function(req, res){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  var imageId = req.params.imageId;
  var imgData = req.body.img;
  if(req.file){
    var imgAPI = req.file;
    imgData.url = imgAPI.secure_url;
    imgData.thumbnail = cloudinary.url(imgAPI.public_id + '.' + imgAPI.format, {secure: true, height: 200});
  }
  // console.log(imgData);
  Show.findById(showId, function(err, showFound){
    if(err){
      req.flash('error', err.message);
      res.redirect('back');
    }
    var season = showFound.seasons.id(seasonId);
    var image = season.images.id(imageId);
    var imgToDeleteURL = image.url;
    image.set(imgData);
    showFound.save(function(err){
      if(err){
        req.flash('error', err.message);
        return res.redirect('back');
      }
      var regex = new RegExp('^(.*?)res\\.cloudinary\\.com\\/' + process.env.CLOUDINARY_NAME + '\/(.*?)\/(' + process.env.CLOUDINARY_FOLDER + '\/(.*?))\\.(.*)');
      var imgToDeleteMatches = imgToDeleteURL.match(regex);
      cloudinary.v2.uploader.destroy(imgToDeleteMatches[3], function(error, result){
        if(error){
          // console.log(error);
          return
        }
        // console.log(result);
      });
      res.redirect('/shows/' + showId);
    });
  });
});

/* DESTROY */
router.delete('/:showId/seasons/:seasonId/images/:imageId', isLoggedIn, isActive, isImageAuthor, function(req, res){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  var imgId = req.params.imageId;
  Show.findById(showId, function(err, showFound){
    if(err){
      req.flash('error', err.message);
      res.redirect('back');
    }
    var season = showFound.seasons.id(seasonId);
    var imgArr = season.images;
    var imgIndex;
    for(var i = 0; i < imgArr.length; i++){
      if(imgArr[i]._id == imgId){
        // console.log('match: ' + imgArr[i]);
        imgIndex = i;
        break
      }
    }
    if(typeof imgIndex){
      var regex = new RegExp('^(.*?)res\\.cloudinary\\.com\\/' + process.env.CLOUDINARY_NAME + '\/(.*?)\/(' + process.env.CLOUDINARY_FOLDER + '\/(.*?))\\.(.*)');
      var imgAPIId = imgArr[imgIndex].url.match(regex);
      // console.log(regex);
      // console.log(imgAPIId);
      cloudinary.v2.uploader.destroy(imgAPIId[3], function(error, result){
        if(error){
          // console.log(error);
          return
        }
        // console.log(result);
      });
      imgArr.splice(imgIndex, 1);
      // console.log('deleted');      
      showFound.save(function(err){
        if(err){
          req.flash('error', err.message);
          return res.redirect('back');
        }
        res.redirect('/shows/' + showId);
      });
    } else {
      // console.log('err not found');
      res.redirect('back');
    }
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

function isActive(req, res, next){
  if(req.user.isActive){
    next();
  } else {
    req.flash('error', 'Please activate your account first!');
    res.redirect('/activate');
  }
}

function isShowAuthor(req, res, next){
  Show.findById(req.params.showId, function(err, showFound){
    if(err){
      req.flash('error', err.message);
      return res.redirect('back');
    }
    if(req.user.id == showFound.author || req.user.isAdmin){
      next();
    } else {
      req.flash('error', 'You do not have permission!');
      res.redirect('back');
    }
  })
}

function isSeasonAuthor(req, res, next){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  Show.findById(showId, function(err, showFound){
    if(err){
      req.flash('error', err.message);
      return res.redirect('back');
    }
    var season = showFound.seasons.id(seasonId);
    if(req.user.id == season.author || req.user.isAdmin){
      next();
    } else {
      req.flash('error', 'You do not have permission!');
      res.redirect('back');
    }
  })
}

function isVideoAuthor(req, res, next){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  var videoId = req.params.videoId;
  Show.findById(showId, function(err, showFound){
    if(err){
      req.flash('error', err.message);
      return res.redirect('back');
    }
    var season = showFound.seasons.id(seasonId);
    var video = season.videos.id(videoId);
    if(req.user.id == video.author || req.user.isAdmin){
      next();
    } else {
      req.flash('error', 'You do not have permission!');
      res.redirect('back');
    }
  })
}

function isImageAuthor(req, res, next){
  var showId = req.params.showId;
  var seasonId = req.params.seasonId;
  var imageId = req.params.imageId;
  Show.findById(showId, function(err, showFound){
    if(err){
      req.flash('error', err.message);
      return res.redirect('back');
    }
    var season = showFound.seasons.id(seasonId);
    var image = season.images.id(imageId);
    if(req.user.id == image.author || req.user.isAdmin){
      next();
    } else {
      req.flash('error', 'You do not have permission!');
      res.redirect('back');
    }
  })
}

function isUserId(req, res, next){
  var userId = req.params.userId;
  if(userId == req.user.id){
    next();
  } else {
    req.flash('error', 'Unauthorized: you are not the user!');
    res.redirect('back');
  }
}

module.exports = router;