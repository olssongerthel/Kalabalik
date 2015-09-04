var db = require('../config/settings'),
    helpers = require('../utils/helpers');

exports.stock = function(req, res) {
  var response = {};
  var filter = req.query.filter ? helpers.filter(req.query.filter) : '';
  var meta = helpers.ListMetadata(req);
  meta.filters = filter.params;

  // Build a paginated query
  var query = helpers.PaginatedQuery({
    table: 'LagerSaldo',
    orderBy: 'Rörelsedatum',
    filter: filter.string,
    meta: meta
  });

  // Build a count query
  var count = 'SELECT COUNT(*) FROM LagerSaldo ' + filter.string;

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
    // Fetch the requested stock data
    var request = new db.sql.Request(connection);
    request.query(query).then(function(recordset) {
      // Add metadata
      response._metadata = helpers.ListMetadata.buildPager(meta, req, recordset);
      response._metadata.responseTime = new Date().getTime() - response._metadata.responseTime + ' ms';
      // Add stock data
      response.response = recordset;
      // Send to the client
      res.send(response);
    }).catch(function(err) {
      res.send(err);
    });
  });
};
