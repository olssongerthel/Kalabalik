var db = require('../config/config'),
    helpers = require('../utils/helpers');

exports.findAll = function(req, res) {

  // Log the request
  helpers.log({
    type: 'info',
    msg: 'Request for suppliers.',
    meta: {
      ip: req.ip,
      query: req.query
    }
  });

  var response = {};
  var filter = req.query.filter ? helpers.filter(req.query.filter) : '';
  var meta = helpers.ListMetadata(req);
  meta.filters = filter.params;

  // Build a paginated query
  var query = helpers.PaginatedQuery({
    table: 'Lev',
    orderBy: 'LevNr ASC',
    filter: filter.string,
    meta: meta
  });

  // Build a count query
  var count = 'SELECT COUNT(*) FROM Lev ' + filter.string;

  // Connect to the database
  var connection = new db.sql.Connection(db.supplier, function(err) {
    // Perform a total row count
    var countRequest = new db.sql.Request(connection);
    countRequest.query(count).then(function(recordset) {
      // Add metadata
      meta.totalCount = recordset[0][''];
    }).catch(function(err) {
      console.log(err);
    });
    // Fetch the requested customer data
    var request = new db.sql.Request(connection);
    request.query(query).then(function(recordset) {
      // Add metadata
      response._metadata = helpers.ListMetadata.buildPager(meta, req, recordset);
      response._metadata.responseTime = new Date().getTime() - response._metadata.responseTime + ' ms';
      // Add customer data
      response.response = recordset;
      // Send to the client
      res.send(response);
    }).catch(function(err) {
      res.send(err);
    });
  });
};
