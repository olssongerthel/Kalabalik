var db = require('../config/settings'),
    helpers = require('../utils/helpers');

var getLineItems = function(orderId, order, res) {
  var connection = new db.sql.Connection(db.config, function(err) {
    var request = new db.sql.Request(connection);
    request.query('SELECT * FROM [dbo].[FaktK] WHERE [Ordernr] =' + orderId + ';', function(err, recordset) {
      order[0].OrderRader = recordset;
      res.send(order);
    });
  });
};

exports.findAll = function(req, res) {
  var response = {};
  var filter = req.query.filter ? helpers.filter(req.query.filter) : '';
  var meta = helpers.ListMetadata(req);
  meta.filter = filter.params;

  // Build a paginated query
  var query = 'SELECT * ' +
              'FROM (' +
                'SELECT ROW_NUMBER() OVER (ORDER BY Orderdatum DESC) AS RowNum, *' +
                'FROM FaktH ' +
                filter.string +
                ') AS RowConstrainedResult' +
              ' WHERE RowNum >' + meta.perPage * (meta.currentPage - 1) +
                ' AND RowNum <= ' + meta.perPage * meta.currentPage +
              ' ORDER BY RowNum';
  // Build a count query
  var count = 'SELECT COUNT(*) FROM FaktH ' + filter.string;

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
      // Add pagination metadata
      response._metadata = helpers.ListMetadata.buildPager(meta, req, recordset);
      // Add the data
      response.results = recordset;
      // Send to the client
      res.send(response);
    }).catch(function(err) {
      res.send(err);
    });
  });
};

exports.findById = function(req, res) {
  var orderId = req.params.id;
  var query = 'SELECT * FROM [dbo].[FaktH] WHERE [Ordernr] =' + orderId + ';';
  var connection = new db.sql.Connection(db.config, function(err) {
    var request = new db.sql.Request(connection);
    request.query(query).then(function(recordset) {
      if (recordset.length > 0) {
        getLineItems(orderId, recordset, res);
      } else {
        res.status(404).send({
          status: 404,
          message: "Couldn't find an order with that number."
        });
      }
    }).catch(function(err) {
      res.send(err);
    });
  });
};
