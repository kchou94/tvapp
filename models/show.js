/*=========
   Show!
   Model!
=========*/
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var showSchema = new Schema({
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
            spoiler: Boolean,
            author: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        }],
        images: [{
            description: String,
            url: String,
            thumbnail: String,
            spoiler: Boolean,
            author: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        }],
        author:{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    author:{
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    schemaVersion: {
        type: String,
        default: '0.2.0'
    }
});

var Show = mongoose.model('Show', showSchema);

module.exports = Show;