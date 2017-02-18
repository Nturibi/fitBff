const EasyExport = require('easy-export');
const winston = require("winston");
const settings = require('../settings');

let the_export = EasyExport();

let IdentityProvider = function() {
    
};

let GoogleIdentityProvider = function() {
    this.google = require('googleapis');
    this.plus = this.google.plus('v1');
    this.OAuth2 = this.google.auth.OAuth2;
};

let BasicIdentity = function(displayName, emailAddress, extraInfo) {
    this.displayName = displayName;
    this.emailAddress = emailAddress;
    this.extraInfo = extraInfo;
};




GoogleIdentityProvider.prototype = Object.create(IdentityProvider.prototype);
GoogleIdentityProvider.prototype.constructor = GoogleIdentityProvider;
GoogleIdentityProvider.prototype.getPrefix = function() {
    return "Google-";
}
GoogleIdentityProvider.prototype.getIdentity = function(id, extra, callback) {
    let the_provider = this;
    if (!id.startsWith(the_provider.getPrefix())) {
        callback("Invalid id for Google identity provider", null);
        return;
    }
    if (!extra['refreshToken']) {
        callback("No refreshToken provided.", null);
        return;
    }
    let oauth2Client = new the_provider.OAuth2(
        settings.GOOGLE_CLIENT_ID,
        settings.GOOGLE_CLIENT_SECRET,
        "http://google.com/" // not supposed to happen
    );
    oauth2Client.setCredentials({
      access_token: 'Dont have one!',
      refresh_token: extra['refreshToken'],
    });
    oauth2Client.refreshAccessToken(function(err, tokens) {
        if (err) {
            callback(err, null);
            return;
        }
        the_provider.plus.people.get({
        userId : "me",
        auth: oauth2Client,
    }, function(err, response) {
        if (err) {
            callback(err, null);
            return;
        }
        
        let primaryEmail;
        for (let i=0; i < response.emails.length; i++) {
            if (response.emails[i].type === 'account') { primaryEmail = response.emails[i].value; break;}
        }
        
        let displayName = response.displayName;
        callback(null, new BasicIdentity(displayName, primaryEmail, response));
        
    });
    });
    
}