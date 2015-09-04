var db = require('../config/settings'),
    helpers = require('../utils/helpers');

exports.findAll = function(req, res) {
  var response = {};
  var filter = req.query.filter ? helpers.filter(req.query.filter) : '';
  var meta = helpers.ListMetadata(req);
  meta.filters = filter.params;

  // Build a paginated query
  var query = helpers.PaginatedQuery({
    table: 'Art',
    orderBy: 'RevideradDag',
    filter: filter.string,
    meta: meta
  });

  // Build a count query
  var count = 'SELECT COUNT(*) FROM Art ' + filter.string;

  // Connect to the database
  var connection = new db.sql.Connection(db.config, function(err) {
    // Perform a total row count
    var countRequest = new db.sql.Request(connection);
    countRequest.query(count).then(function(recordset) {
      // Add metadata
      meta.totalCount = recordset[0][''];
    }).catch(function(err) {
      console.log(err);
    });
    var request = new db.sql.Request(connection);
    request.query(query).then(function(recordset) {
      // Add metadata
      response._metadata = helpers.ListMetadata.buildPager(meta, req, recordset);
      response._metadata.responseTime = new Date().getTime() - response._metadata.responseTime + ' ms';
      // Add products
      response.response = recordset;
      // Send to the client
      res.send(response);
    }).catch(function(err) {
      res.send(err);
    });
  });
};

exports.findBySKU = function(req, res) {
  var response = {};
  var sku = req.params.sku;
  response._metadata = helpers.SingleMetadata();

  var stockStatus = function(product) {
    var connection = new db.sql.Connection(db.config, function(err) {
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
  var connection = new db.sql.Connection(db.config, function(err) {
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
