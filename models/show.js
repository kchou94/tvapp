/*=========
   Show!
   Model!
=========*/
var mongoose = require('mongoose');

var showSchema = new mongoose.Schema({
    title: String,
    foreignTitle: String,
    image: String,
    thumbnail: String,
    description: String,
    year: Number,
    tags: [String],
    seasons: [{
        name: String,
        videos: [{
            description: String,
            url: String,
            thumbnail: String,
            spoiler: Boolean
        }],
        images: [{
            description: String,
            url: String,
            thumbnail: String,
            spoiler: Boolean
        }]
    }],
    schemaVersion: {
        type: Number,
        default: 0.1
    }
});

var Show = mongoose.model('Show', showSchema);

module.exports = Show;