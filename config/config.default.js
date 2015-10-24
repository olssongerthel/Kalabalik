var sql = require('mssql');

// Add mssql database config here as per instructions from:
// https://www.npmjs.com/package/mssql
// 'invoicing' is the Avance Fakturering database (usually 'Fakt000')
// and 'supplier' should be the Avance Leverantör database (usually 'lres000')

var invoicing = {
  // user: '',
  // password: '',
  // server: '',
  // database: '',
  // options: {
  //     encrypt: true
  // }
}

var supplier = {
  // user: '',
  // password: '',
  // server: '',
  // database: '',
  // options: {
  //     encrypt: true
  // }
}

// Add a username and password to enable basic authentication for the API.
var credentials = {
  username: '',
  password: ''
}

exports.port = 3000; // Select the port to run Kalabalik on.
exports.sql = sql;
exports.invoicing = invoicing;
exports.supplier = supplier;
exports.credentials = credentials;
