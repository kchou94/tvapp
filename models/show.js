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
    tags: [String]
});

var Show = mongoose.model('Show', showSchema);

module.exports = Show;