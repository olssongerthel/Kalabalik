var db = require('../config/settings'),
    helpers = require('../utils/helpers');

exports.findAll = function(req, res) {

  // Log the request
  helpers.log({
    type: 'info',
    msg: 'Request for orders',
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
    table: 'FaktH',
    orderBy: 'Orderdatum DESC',
    filter: filter.string,
    meta: meta
  });

  // Build a count query
  var count = 'SELECT COUNT(*) FROM FaktH ' + filter.string;

  // Connect to the database
  var connection = new db.sql.Connection(db.invoicing, function(err) {
    // Perform a total row count
    var countRequest = new db.sql.Request(connection);
    countRequest.query(count).then(function(recordset) {
      // Add metadata
      meta.totalCount = recordset[0][''];
    }).catch(function(err) {
      // Log the error
      helpers.log({
        type: 'error',
        msg: 'Error when requesting orders: ' + err,
        meta: {
          ip: req.ip,
          query: req.query
        }
      });
      res.send(err);
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
      // Log the error
      helpers.log({
        type: 'error',
        msg: 'Error when requesting orders: ' + err,
        meta: {
          ip: req.ip,
          query: req.query
        }
      });
      res.send(err);
    });
  });
};

exports.findById = function(req, res) {

  // Log the request
  helpers.log({
    type: 'info',
    msg: 'Request for single order.',
    meta: {
      ip: req.ip,
      query: req.query
    }
  });

  var response = {};
  var orderId = req.params.id;
  response._metadata = helpers.SingleMetadata();

  // Make sure we're getting an integer as order ID.
  if (orderId % 1 !== 0) {
    res.status(400).send({
      status: 400,
      message: "Please supply a valid order number."
    });
  }

  var getLineItems = function(order) {
    var connection = new db.sql.Connection(db.invoicing, function(err) {
      var request = new db.sql.Request(connection);
      request.query('SELECT * FROM FaktK WHERE [Ordernr] = ' + orderId, function(err, recordset) {
        // Add the line items to the order
        order.OrderRader = recordset;
        getCustomer(order);
      });
    });
  };

  var getCustomer = function(order) {
    var customerQuery = 'SELECT * FROM Kund WHERE [KundNr] = \'' + order.Kundnr + '\'';
    var connection = new db.sql.Connection(db.invoicing, function(err) {
      var request = new db.sql.Request(connection);
      request.query(customerQuery, function(err, recordset) {
        // Add the customer data to the order
        order.Kund = recordset[0];
        // Add metadata to the response
        response._metadata.responseTime = new Date().getTime() - response._metadata.responseTime + ' ms';
        // Add the order to the response
        response.response = order;
        // Send it to the client
        res.send(response);
      });
    });
  };

  var query = 'SELECT * FROM FaktH WHERE [Ordernr] =' + orderId + ';';
  var connection = new db.sql.Connection(db.invoicing, function(err) {
    var request = new db.sql.Request(connection);
    request.query(query).then(function(recordset) {
      if (recordset.length > 0) {
        getLineItems(recordset[0]);
      } else {
        res.status(404).send({
          status: 404,
          message: "Couldn't find an order with that number."
        });
      }
    }).catch(function(err) {
      // Log the error
      helpers.log({
        type: 'error',
        msg: 'Error when requesting orders: ' + err,
        meta: {
          ip: req.ip,
          query: req.query
        }
      });
      res.send(err);
    });
  });
};
