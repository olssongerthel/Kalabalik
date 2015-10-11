var db = require('../config/config'),
    helpers = require('../utils/helpers');

exports.index = function(req, res) {

  helpers.createIndex({
    endpoint: 'Customers',
    db: 'invoicing',
    table: 'Kund',
    orderBy: 'KundNr DESC',
    request: req
  }, function(err, index){
    if (!err) {
      res.send(index);
    } else {
      res.send(err.message);
    }
  });

};

exports.findById = function(req, res) {

  // Log the request
  helpers.log({
    type: 'info',
    msg: 'Request for single customer.',
    meta: {
      ip: req.ip,
      query: req.query
    }
  });

  var response = {};
  var customerId = req.params.id;
  response._metadata = helpers.SingleMetadata();

  var getOrders = function(customer) {
    var connection = new db.sql.Connection(db.invoicing, function(err) {
      var request = new db.sql.Request(connection);
      request.query('SELECT * FROM FaktH WHERE Kundnr = \'' + customerId + '\';', function(err, recordset) {
        // Add the orders to the customer
        customer.Ordrar = recordset;
        // Add metadata to the response
        response._metadata.responseTime = new Date().getTime() - response._metadata.responseTime + ' ms';
        // Add the order to the response
        response.response = customer;
        // Send it to the client
        res.send(response);
      });
    });
  };

  var getCustomer = function(customer) {
    var customerQuery = 'SELECT * FROM Kund WHERE KundNr = \'' + order.Kundnr + '\'';
    var connection = new db.sql.Connection(db.invoicing, function(err) {
      var request = new db.sql.Request(connection);
      request.query(customerQuery, function(err, recordset) {
        // Add the customer data to the order
        customer = recordset[0];
        // Add metadata to the response
        response._metadata.responseTime = new Date().getTime() - response._metadata.responseTime + ' ms';
        // Add the order to the response
        response.response = order;
        // Send it to the client
        res.send(response);
      });
    });
  };

  var query = 'SELECT * FROM Kund WHERE KundNr = \'' + customerId + '\';';
  var connection = new db.sql.Connection(db.invoicing, function(err) {
    var request = new db.sql.Request(connection);
    request.query(query).then(function(recordset) {
      if (recordset.length > 0) {
        getOrders(recordset[0]);
      } else {
        res.status(404).send({
          status: 404,
          message: "Couldn't find a customer with that ID."
        });
      }
    }).catch(function(err) {
      // Log the error
      helpers.log({
        type: 'error',
        msg: 'Error when requesting customer: ' + err,
        meta: {
          ip: req.ip,
          query: req.query
        }
      });
      res.send(err);
    });
  });
};
