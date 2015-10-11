var db = require('../config/config'),
    helpers = require('../utils/helpers');

exports.index = function(req, res) {

  helpers.createIndex({
    endpoint: 'Products',
    db: 'invoicing',
    table: 'Art',
    orderBy: 'RevideradDag DESC',
    request: req
  }, function(err, index){
    if (!err) {
      res.send(index);
    } else {
      res.send(err.message);
    }
  });

};

exports.findBySKU = function(req, res) {

  // Log the request
  helpers.log({
    type: 'info',
    msg: 'Request for single product.',
    meta: {
      ip: req.ip,
      query: req.query
    }
  });

  var response = {};
  var sku = req.params.sku;
  response._metadata = helpers.SingleMetadata();

  var stockStatus = function(product) {
    var connection = new db.sql.Connection(db.invoicing, function(err) {
      var request = new db.sql.Request(connection);
      request.query('SELECT * FROM LagerSaldo WHERE [ArtikelNr] = \'' + sku + '\'', function(err, recordset) {
        // Add the stock data to the product
        product[0].lagerSaldo = recordset;
        // Add metadata to the response
        response._metadata.responseTime = new Date().getTime() - response._metadata.responseTime + ' ms';
        // Add the product to the response
        response.response = product;
        res.send(response);
      });
    });
  };

  var query = 'SELECT * FROM Art WHERE [ArtikelNr] = \'' + sku + '\'';
  var connection = new db.sql.Connection(db.invoicing, function(err) {
    var request = new db.sql.Request(connection);
    request.query(query, function(err, recordset) {
      if (recordset.length > 0) {
        stockStatus(recordset);
      } else {
        res.status(404).send({
          status: 404,
          message: "Couldn't find a product with a matching SKU."
        });
      }
    });
  });
};
