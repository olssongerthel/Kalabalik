var sql = require('mssql');

var config = {
  // Add mssql database config here as per instructions from:
  // https://www.npmjs.com/package/mssql
}

exports.sql = sql;
exports.config = config;
exports.port = 3000;
