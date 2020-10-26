var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// kreiramo novu shemu
let songDetailsSchema = new Schema({
    link: String,
    cover: String,
    name: String,
    artist: String,
    album: String,
    genre: String,
    music: String,
    lyrics: String,
    arrangement: String,
    averageRating: Number,
    ratings : [Number],
    comments: [
        {
            author: String,
            title: String,
            context: String,
            likes: Number,
            dislikes: Number,
            replies: [{ name: String, title: String, context: String, likes: Number, dislikes: Number}]
        }
    ]
}, { collection: 'collection' });

let songDetails = mongoose.model('collection', songDetailsSchema);

module.exports = songDetails;
