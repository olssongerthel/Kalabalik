var sql = require('mssql');

// Add mssql database config here as per instructions from:
// https://www.npmjs.com/package/mssql
// Invoicing is the Avance Fakturering database (usually 'Fakt000')
// and Supplier should be the Avance Leverantör database (usually 'lres000')

var invoicing = {

}

var supplier = {

}

// Add a username and password to enable basic authentication
var credentials = {
  username: '',
  password: ''
}

exports.sql = sql;
exports.invoicing = invoicing;
exports.supplier = supplier;
exports.credentials = credentials;
exports.port = 3000;
