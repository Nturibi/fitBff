const EasyExport = require('../utils/easy-export.js');
const mongojs = require('mongojs');
const settings = require('../settings');
var Fiber = require('fibers');
const winston = require('winston');
const identProvider = require('identity-provider');
let db = mongojs(settings.MONGODB_URL, ['userdata']);

let the_export = EasyExport();
module.exports = the_export;

the_export.User = function(id) {
    this.id = id;
    this.properties = {};
};

let User = the_export.User;

User.findById = function(id, callback) {
    let user = new User(id);
    user.loadFromDatabase(callback);
};

User.findOrCreate = function(searchParams, callback) {
    // Access token omitted because it's short-lived.
    if (searchParams['googleId'] && !searchParams['id']) {
        searchParams['id'] = User.fromGoogleId(searchParams['googleId']);
    }
    let user = new User(searchParams.id);
    user.loadFromDatabase(function(err, user) {
        if (err) {
            // Error
            winston.log('info', 'Error occurred in loading from database', err);
            return;
        }
        if (!user) {
            user.create();
            user.saveToDatabase(callback);
        }
    });
};

User.prototype.loadFromDatabase = function(callback) {
    let user = this;
    db.find({'id' : user.id}).limit(1).next(function(err, doc) {
        if (!err && doc) {
            for (let key in doc) {
                if (!doc.hasOwnProperty(key)) continue;
                user[key] = doc[key];
            }
            user.foundInDatabase = true;
        }
        if (callback)
            callback(err, user);
    });
    
};

let identityProviders = {};
identityProviders['Google-'] = new identProvider.GoogleIdentityProvider();

User.prototype.create = function(identityProvider) {
    if (this.id.startsWith("Google-")) {
        
    }
    this.saveToDatabase();
}

User.prototype.saveToDatabase = function(callback) {
    db.update({'id' : this.id}, this, {upsert : true}, callback);
};

User.toGoogleId = function(id) {
    return "Google-"+id;
}

User.fromGoogleId = function(google_id) {
    return google_id.substring(6);
};
