var db = require('../config/settings'),
    helpers = require('../utils/helpers');

exports.findAll = function(req, res) {
  var response = {};
  var filter = req.query.filter ? helpers.filter(req.query.filter) : '';
  var meta = helpers.ListMetadata(req);
  meta.filter = filter.params;

  // Build a paginated query
  var query = 'SELECT * ' +
              'FROM (' +
                'SELECT ROW_NUMBER() OVER (ORDER BY Ordernr DESC) AS RowNum, *' +
                'FROM FaktK ' +
                filter.string +
                ') AS RowConstrainedResult' +
              ' WHERE RowNum >' + meta.perPage * (meta.currentPage - 1) +
                ' AND RowNum <= ' + meta.perPage * meta.currentPage +
              ' ORDER BY RowNum';
  // Build a count query
  var count = 'SELECT COUNT(*) FROM FaktK ' + filter.string;

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
    // Fetch the requested orders
    var request = new db.sql.Request(connection);
    request.query(query).then(function(recordset) {
      // Add metadata
      response._metadata = helpers.ListMetadata.buildPager(meta, req, recordset);
      response._metadata.responseTime = new Date().getTime() - response._metadata.responseTime + ' ms';
      // Add orders
      response.response = recordset;
      // Send to the client
      res.send(response);
    }).catch(function(err) {
      res.send(err);
    });
  });
};
