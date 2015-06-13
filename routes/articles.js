var db = require('../config/settings'),
    helpers = require('../utils/helpers');

exports.findAll = function(req, res) {
  // Only grab the top 20 unless explicitly told otherwise.
  var top = req.query.top ? req.query.top : 20;
  // Build the query
  var query = 'SELECT TOP ' + top + ' * FROM [dbo].[Art] ' + helpers.filter(req.query) + ';';
  console.log(query);
  var connection = new db.sql.Connection(db.config, function(err) {
    var request = new db.sql.Request(connection);
    request.query(query, function(err, recordset) {
      res.send(recordset);
    });
  });
};

exports.findBySKU = function(req, res) {
  var sku = req.params.sku;
  var query = 'SELECT * FROM Art WHERE [ArtikelNr] = \'' + sku + '\';';
  var connection = new db.sql.Connection(db.config, function(err) {
    var request = new db.sql.Request(connection);
    request.query(query, function(err, recordset) {
      if (recordset.length > 0) {
        res.send(recordset);
      } else {
        res.status(404).send({
          status: 404,
          message: "Couldn't find a product with a matching SKU."
        });
      }
    });
  });
};
