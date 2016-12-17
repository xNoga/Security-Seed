var express = require('express');
var router = express.Router();
var User = require('../models/user')
var jwt = require('jwt-simple')
var config = require('../config/database')
var passport = require('passport')
const jwtConfig = require("../config/jwtConfig").jwtConfig;

/* GET home page. */
router.post('/signup', function(req, res, next) {
  if (!req.body.userName || !req.body.password) {
    res.json({success: false, msg: 'Please pass name and password.'});
  } else {
    var newUser = new User({
      userName: req.body.userName,
      password: req.body.password
    });
    // save the user
    newUser.save(function(err) {
      if (err) {
        console.log(err)
        return res.json({success: false, msg: 'Username already exists.'});
      }
      res.json({success: true, msg: 'Successful created new user.'});
    });
  }
});

router.post('/authenticate', function(req, res) {
  User.findOne({
    userName: req.body.userName
  }, function (err, user) {
    if (err) throw err;
    if (!user) {
      res.status(401).send({ msg: 'Authentication failed. User not found.'});
    } else {
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          // if user is found and password is right create a token
          var iat = new Date().getTime()/1000; //convert to seconds
          var exp = iat+jwtConfig.tokenExpirationTime;
          var payload = {
            aud: jwtConfig.audience,
            iss: jwtConfig.issuer,
            iat: iat,
            exp: exp,
            sub: user.userName
          }
          var token = jwt.encode(payload, jwtConfig.secret);
          // return the information including token as JSON
          res.json({token: 'JWT ' + token});
        } else {
          res.status(401).send({ msg: 'Authentication failed. Wrong password.'});
        }
      });
    }
  });
});

router.get('/memberinfo', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, jwtConfig.secret);
    console.log(decoded)
    User.findOne({
      userName: decoded.sub
    }, function(err, user) {
      if (err) throw err;

      if (!user) {
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      } else {
        res.json({success: true, msg: 'Welcome in the member area ' + user.userName + '!'});
      }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

module.exports = router;
