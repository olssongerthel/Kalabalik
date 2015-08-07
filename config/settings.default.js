var sql = require('mssql');

// Add mssql database config here as per instructions from:
// https://www.npmjs.com/package/mssql
var config = {

}

// Add a username and password to enable basic authentication
var credentials = {
  username: '',
  password: ''
}

exports.sql = sql;
exports.config = config;
exports.credentials = credentials;
exports.port = 3000;
