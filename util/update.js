var mongoose = require('mongoose');
var Show = require('../models/show');
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}

mongoose.connect(process.env.DB_URL);

/*==================
 GENERATE THUMBNAILS
 ==================*/

// var regex = new RegExp('(^(.*?)res\\.cloudinary\\.com\\/' + process.env.CLOUDINARY_NAME + '\\/image\\/upload\\/)');
// console.log(regex);
// Show.find({}, function(err, shows){
//     if(err){
//         console.log(err);
//         return
//     }
//     shows.forEach(function(show){
//         if(!show.thumbnail){
//             console.log('- no thumb found: ' + show.title);
//             var thumbURL = show.image.replace(regex, '$1c_scale,h_400/')
//             console.log('thumb url: ' + show.thumbnail);
//             show.thumbnail = thumbURL;
//             console.log('thumbnail set!');
//             if(!show.schemaVersion || show.schemaVersion !== 0.1){
//                 show.schemaVersion = 0.1;
//                 console.log('version updated');
//             } else {
//                 console.log('version up to date');
//             }
//         } else {
//             console.log('+ has thumb!: ' + show.title);
//             if(!show.schemaVersion || show.schemaVersion !== 0.1){
//                 show.schemaVersion = 0.1;
//                 console.log('version updated');
//             } else {
//                 console.log('version up to date');
//             }
//         }
//         show.save(function(err){
//             if(err){
//                 console.log(err);
//             }
//         });
//     });
//     console.log(done);    
// });

/*=====================
 0.1.0 -> 0.2.0
 Fix versioning
 =====================*/

Show.find({}, function(err, shows){
    if(err){
        console.log(err);
        return
    }
    shows.forEach(function(show){
        if(show.schemaVersion != '0.2.0'){
            console.log('- schema version: ' + show.schemaVersion + ' - ' + show.title);
            if(show.schemaVersion == '0.1'){
                show.schemaVersion = '0.2.0';
                console.log('Incremented version');
            } else if(show.schemaVersion == '0.2'){
                show.schemaVersion = '0.2.0';
                console.log('Fixed version syntax');
            } else {
                console.log('WARN: Will not touch this!');
            }
        } else {
            console.log('+ up to date: ' + show.title);
        }
        show.save(function(err){
            if(err){
                console.log(err);
            }
        });
    });
    console.log('done');    
});