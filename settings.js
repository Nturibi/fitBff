let db_host = process.env.OPENSHIFT_MONGODB_DB_HOST;
let db_port = process.env.OPENSHIFT_MONGODB_DB_PORT;
let db_user = 'admin';
let db_password = 'TwPAPjIQ2Eam';
let db_name = 'drugstracker';
module.exports = {
    "BASE_URL" : "https://drugstracker-svterraflops.rhcloud.com",
    "SESSION_SECRET" : "OdpaOJ7EOt8fOmoQa7tj",
    "MONGODB_URL" : 'mongodb://'+db_user+':'+db_password+'@'+db_host+':'+db_port+'/',
    "GOOGLE_CLIENT_ID" : "817292671337-qgapqqk29q99r921qsuca6bppnta6mfp.apps.googleusercontent.com",
    "GOOGLE_CLIENT_SECRET" : "X-egVIfscKMTx0FOh-JbsEHH",
    "AUTH_METHODS" : ['google-id-token', 'google-authcode']
};