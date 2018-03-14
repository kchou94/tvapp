/*=========
   Show!
   Model!
=========*/
var mongoose = require('mongoose');

var tagSchema = new mongoose.Schema({
    name: String,
    shows: [{
        type: Schema.Types.ObjectId,
        ref: 'Show'
    }]
});

var Tag = mongoose.model('Show', tagSchema);

module.exports = Tag;