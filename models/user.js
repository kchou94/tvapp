/*=========
   User!
   Model!
=========*/

//0.0.1 is backwards compatible with 0.0.0!

var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    displayName: String,
    avatar: {
        publicId: String,
        url: String,
        thumbnail: String,
    },
    email: String,
    likes: [
        {
            kind: String,
            item: {
                type: Schema.Types.ObjectId,
                refPath: 'likes.kind'
            }            
        }
    ],
    isAdmin:{
        type: Boolean,
        default: false
    },
    isActive:{
        type: Boolean,
        default: false
    },
    schemaVersion: {
        type: String,
        default: '0.0.1'
    }
});

userSchema.plugin(passportLocalMongoose, {
    usernameLowerCase: true
});

var User = mongoose.model('User', userSchema);

module.exports = User;