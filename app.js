var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var morgan = require('morgan')
var mongoose = require('mongoose')
var passport = require('passport')
var config = require('./config/database')
var User = require('./models/user')
var jwt = require('jwt-simple')


var api = require('./routes/api');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//app.use(express.static(path.join(__dirname, 'public')));
// log to console
app.use(morgan('dev'))
// Use the passport package in our application
// var passportConfig = require("./config/passport");
// passportConfig(passport);

// connect to database
mongoose.connect(config.database);

// pass passport for configuration
require('./config/passport')(passport);

app.get('/', function (req, res) {
    res.send("Hello! The API at http://localhost/3000/api")
})

app.use('/users', users);
app.use('/api', function(req, res, next) {
  passport.authenticate('jwt', {session: false}, function(err, user, info) {
    if (err) { res.status(403).json({mesage:"Token could not be authenticated",fullError: err}) }
    if (user) {
      return next();
    }
    return res.status(403).json({mesage: "Token could not be authenticated", fullError: info});
  })(req, res, next);
});
app.use('/api', api);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
