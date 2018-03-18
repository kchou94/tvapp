/*=========
   Show!
   Model!
=========*/
var mongoose = require('mongoose');

var showSchema = new mongoose.Schema({
    title: String,
    foreignTitle: String,
    image: String,
    description: String,
    year: Number,
    tags: [String],
    seasons: [{
        name: String,
        videos: [{
            title: String,
            url: String,
            thumbnail: String,
            spoiler: Boolean
        }]
    }]
});

var Show = mongoose.model('Show', showSchema);

module.exports = Show;