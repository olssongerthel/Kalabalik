var db = require('../config/settings'),
    helpers = require('../utils/helpers');

exports.findAll = function(req, res) {
  var response = {};
  var filter = req.query.filter ? helpers.filter(req.query.filter) : '';
  var meta = helpers.ListMetadata(req);
  meta.filter = filter.params;
  meta.perPage = 50;

  // Build a paginated query
  var query = 'SELECT * ' +
              'FROM (' +
                'SELECT ROW_NUMBER() OVER (ORDER BY RevideradDag DESC) AS RowNum, *' +
                'FROM Art ' +
                filter.string +
                ') AS RowConstrainedResult' +
              ' WHERE RowNum >' + meta.perPage * (meta.currentPage - 1) +
                ' AND RowNum <= ' + meta.perPage * meta.currentPage +
              ' ORDER BY RowNum';
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
    request.query(query, function(err, recordset) {
      // Add pagination metadata
      response._metadata = helpers.ListMetadata.buildPager(meta, req, recordset);
      // Add the data
      response.results = recordset;
      // Send to the client
      res.send(response);
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
