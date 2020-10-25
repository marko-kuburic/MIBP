var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

// koristimo mongoose model koju smo kreirali u folderu model
var songDetails = require('./model/songDetails');

// Connection URL
var url = 'mongodb://localhost:27017/mibp';
mongoose.connect(url, {useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false});


// konfigurisemo bodyParser()
// da bismo mogli da preuzimamo podatke iz POST zahteva
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

var port = 3000; // na kom portu slusa server

// ruter za songDetails
var songDetailsRouter = express.Router(); // koristimo express Router

// definisanje ruta za songDetails
songDetailsRouter
  .get('/:id', function(req, res, next) {
    songDetails.findOne({
      "_id": req.params.id
    }).exec(function(err, entry) {
      // ako se desila greska predjemo na sledeci middleware (za rukovanje greskama)
      if (err) next(err);
      res.json(entry);
    });
  })
  .get('/', function(req, res) {
    songDetails.find({}, function(err, data, next) {
      res.json(data);
    });
  })
  .post('/', function(req, res, next) {
    let song = new songDetails(req.body);
    song.save(function(err, entry) {
      if (err) next(err);
      res.json(entry);
    });
  })
  .put('/:id', function(req, res, next) {
    songDetails.findById({
      "_id": req.params.id
    }, function(err, SongDetails) {
    if (err) next(err);
      SongDetails.set(req.body);
	    SongDetails.save(function(err, entry) {
		if (err) next(err);
	  res.json(entry);
		});
    });
  })
  .put('/:id/comment', function(req, res, next) {
    songDetails.findById({
      "_id": req.params.id
    }, function(err, SongDetails) {
    if (err) next(err);
      SongDetails.comments.push(req.body);
	    SongDetails.save(function(err, entry) {
		if (err) next(err);
	  res.json(entry);
		});
    });
  })
  .put("/:id/rate", function (req, res, next) {
    songDetails.findOne(
      {
        _id: req.params.id,
      }, function(err, songDetails) {
        if (err) next(err);
        let rating = req.body.rating;
        if (songDetails.ratings == []) {
          songDetails.ratings.push(rating);
          songDetails.averageRating = rating;
        } else {
          let temp = songDetails.ratings.length * songDetails.averageRating;
          temp += rating;
          songDetails.ratings.push(rating);
          songDetails.averageRating = temp / songDetails.ratings.length;
        }
        songDetails.save(function(err, entry) {
          if (err) next(err);
          res.json(entry);
        });
      }
    );
  })
  .put('/:id/:commentId/reply', function(req, res, next) {
    songDetails.findById({
      "_id": req.params.id
    }, function(err, songDetails) {
      if (err) next(err);
      let comment = songDetails.comments.find(x => x.id == req.params.commentId);
      if(typeof(comment) === 'undefined'){
        res.status(404).json({error:"Comment not found"});
        return;
      }
      if(typeof(comment.replies) === 'undefined'){ 
        comment.replies = [req.body];
      }
      comment.replies.push(req.body); 
      songDetails.save(function (err, entry) {
        if (err) next(err);
        res.json(entry);
      });         
    }
  );
  })
  .put('/:id/:commentId/like', function(req, res, next) {
    songDetails.findById({
      "_id": req.params.id
    }, function(err, songDetails) {
      if (err) next(err);
      let comment = songDetails.comments.find(x => x.id == req.params.commentId);
      if(typeof(comment) === 'undefined'){
        res.status(404).json({error:"Comment not found"});
        return;
      }
      if(req.body.like === true){
        comment.likes += 1;
      }else if(req.body.like === false){
        comment.dislikes += 1;
      }else{
        next(err);
        return;
      }
      songDetails.save(function (err, entry) {
        if (err) next(err);
        res.json(entry);
      });         
    }
  );
  })
  .put('/:id/:commentId/:replyId/like', function(req, res, next) {
    songDetails.findById({
      "_id": req.params.id
    }, function(err, songDetails) {
      if (err) next(err);
      let comment = songDetails.comments.find(x => x.id == req.params.commentId);
      if(typeof(comment) === 'undefined'){
        res.status(404).json({error:"Comment not found"});
        return;
      }
      reply = comment.replies.find(x => x.id == req.params.replyId);
      if(typeof(reply) === 'undefined'){
        res.status(404).json({error:"Reply not found"});
        return;
      }
      if(req.body.like === true){
        reply.likes += 1;
      }else if(req.body.like === false){
        reply.dislikes += 1;
      }else{
        next(err);
        return;
      }
      songDetails.save(function (err, entry) {
        if (err) next(err);
        res.json(entry);
      });         
    }
  );
  })
  .get('/:id/sort', function(req, res, next) {
    songDetails.findById({
      "_id": req.params.id
    }, function(err, songDetails) {
      if (err) next(err);
      let i = 0;
      let j = 0;
      while(i < songDetails.comments.length){
          j = 0;
          while(j < i){
              if(songDetails.comments[j].likes < songDetails.comments[i].likes){
                  var temp = songDetails.comments[j];
                  songDetails.comments[j] = songDetails.comments[i];
                  songDetails.comments[i] = temp;
              }
              ++j;
          }
          ++i;
      }
    res.json(songDetails);
    }
  );
  })
  .get('/:id/:commentId/sort', function(req, res, next) {
    songDetails.findById({
      "_id": req.params.id
    }, function(err, songDetails) {
      if (err) next(err);
      let comment = songDetails.comments.find(x => x.id == req.params.commentId);
      if(typeof(comment) === 'undefined'){
        res.status(404).json({error:"Comment not found"});
        return;
      }
      let i = 0;
      let j = 0;
      while(i < comment.replies.length){
          j = 0;
          while(j < i){
              if(comment.replies[j].likes < comment.replies[i].likes){
                  var temp = comment.replies[j];
                  comment.replies[j] = comment.replies[i];
                  comment.replies[i] = temp;
              }
              ++j;
          }
          ++i;
      }
    res.json(songDetails);
    }
  );
  })
  .delete('/:id', function(req, res, next) {
    songDetails.findOneAndRemove({
      "_id": req.params.id
    }, function(err, song, successIndicator) {
      if (err) next(err);
      res.json(successIndicator);
    });
  });

// dodavanje rutera zu songDetails /api/songDetails
app.use('/api/songDetails', songDetailsRouter);


//na kraju dodajemo middleware za obradu gresaka
app.use(function(err, req, res, next) {
  var message = err.message;
  var error = err.error || err;
  var status = err.status || 500;

  res.status(status).json({
    message: message,
    error: error
  });
});


// Pokretanje servera
app.listen(port);

