const EasyExport = require('../utils/easy-export.js');
const mongojs = require('mongojs');
const settings = require('../settings');
var Fiber = require('fibers');
const winston = require('winston');
const identProvider = require('identity-provider');
let db = mongojs(settings.MONGODB_URL, ['userdata']);

let the_export = EasyExport();
module.exports = the_export;

// TODO: Implement some sort of locking mechanism so a user can't be accessed and modified concurrently
the_export.User = function(id) {
    this.id = id;
    this.properties = {};
};

let User = the_export.User;
let identityProviders = {};
identityProviders['Google-'] = new identProvider.GoogleIdentityProvider();

User.findById = function(id, callback) {
    let user = new User(id);
    user.loadFromDatabase(callback);
};

User.findOrCreate = function(searchParams, callback) {
    // Access token omitted because it's short-lived.
    let id = searchParams.id;
    if (id.indexOf('-') == -1) return; // Not allowed
    let identityProvider = identityProviders[searchParams.id.substring(0, id.indexOf('-')+1)];
    let user = new User(searchParams.id);
    user.loadFromDatabase(function(err, user) {
        if (err) {
            // Error
            winston.log('info', 'Error occurred in loading from database', err);
            return;
        }
        if (!user) {
            user.create(identityProvider, function(err, theuser) {
                if (err) {
                    winston.log('info', 'Failed to create user', err);
                    return callback(err, null);
                }
                user.saveToDatabase(function(err, sth) {
                    callback(err, err ? null : user);
                });
            });
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
        if (callback) {
            callback(err, user.foundInDatabase ? user : null);
        }
    });
    
};


User.prototype.create = function(identityProvider, callback) {
    identityProvider.getIdentity(this.id, {"refreshToken" : this.refreshToken}, function(err, myIdentity) {
        if (err || !myIdentity) {
            this.properties['name'] = 'Unresolvable Unresolved';
            this.properties['email'] = 'unresolvable@example.com';
            winston.log('info', 'Error in loading data from identity provider.', err);
            return callback(err || 'No identity found.', null);
        }
        this.properties['name'] = myIdentity.displayName;
        this.properties['email'] = myIdentity.emailAddress;
        callback(null, this);
    });
}

User.prototype.saveToDatabase = function(callback) {
    db.update({'id' : this.id}, this, {upsert : true}, callback);
};
