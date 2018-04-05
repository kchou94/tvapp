var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tokenSchema = new Schema({
    tokenStr: String,
    createdAt: {
        type: Date,
        default: Date.now(),
        expires: '1d'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

var Token = mongoose.model('Token', tokenSchema);

module.exports = Token;