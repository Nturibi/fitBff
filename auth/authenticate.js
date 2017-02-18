const passport = require('passport'),
      settings = require('../settings'),
      user = require('user'),
      session = require('express-session'),
      EasyExport = require('../utils/easy-export'),
      winston = require('winston');

let GoogleAuthCodeStrategy = require('passport-google-authcode').Strategy;
let GoogleTokenStrategy = require('passport-google-id-token');

let the_export = EasyExport();
module.exports = the_export;

let MongoStore = require('connect-mongo')(session);
let init_passport = function(app) {
    var User = user(app);
    app.use(passport.initialize());
    app.use(passport.session());
    passport.use(new GoogleAuthCodeStrategy({
        clientID: settings.GOOGLE_CLIENT_ID,
        clientSecret: settings.GOOGLE_CLIENT_SECRET
    },
    function(accessToken, refreshToken, profile, done) {
      User.findOrCreate({ "id" : "Google-"+profile.id, "accessToken" : accessToken, "refreshToken" : refreshToken }, function (err, user) {
          user.refreshToken = refreshToken;
          return done(err, user);
      });
    }));
    
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
    passport.use(new GoogleTokenStrategy({
      clientID: settings.GOOGLE_CLIENT_ID,
    },
    function(parsedToken, googleId, done) {
        User.findById({ id: 'Google-'+googleId }, function (err, user) {
            if (!user) {
                return done('Attempt to create user with token authentication', null);
            } else {
                return done(err, user);
            }
        });
    }
    ));
};

let init_session = function(app) {
    app.use(session({
        secret: settings.SESSION_SECRET,
        store: new MongoStore({
            url: settings.MONGODB_URL
        })
    }));
}

let init_auth = function(app) {
    // The post request to this route should include a JSON object with the key id_token set to the one the client received from Google (e.g. after successful Google+ sign-in).
    app.post('/auth/google',
    passport.authenticate(settings.AUTH_METHODS),
    function (req, res, next) {
        // do something with req.user
        if (!req.user || !req.user.refreshToken) {
            req.logout();
            res.status(400);
            res.end();
            return;
        }
        res.status(req.user? 200 : 401);
        req.session['userid'] = req.user.userid;
        next();
    });
    
    app.get('/auth/logout', passport.authenticate(settings.AUTH_METHODS), function(req, res, next) {
       if (req.isAuthenticated()) {
           req.logout();
           req.session.destroy(function(err) {
              if (err) {
                  winston.log('info', 'Problem happened destroying session', err);
              } 
           });
           next();
       } 
    });
    
}

the_export.functions.push(init_session);
the_export.functions.push(init_passport);
the_export.functions.push(init_auth);

function authenticationMiddleware () {  
  return function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401);
    res.end();
  }
};

the_export.authenticationMiddleware = authenticationMiddleware;