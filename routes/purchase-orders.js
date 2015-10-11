var db = require('../config/config'),
    helpers = require('../utils/helpers');

exports.index = function(req, res) {

  helpers.createIndex({
    endpoint: 'Purchase orders',
    db: 'supplier',
    table: 'InkH',
    orderBy: 'Orderdatum DESC',
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
    msg: 'Request for single purchase order.',
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
      message: "Please supply a valid purchase order number."
    });
  }

  var getLineItems = function(order) {
    var connection = new db.sql.Connection(db.supplier, function(err) {
      var request = new db.sql.Request(connection);
      request.query('SELECT * FROM InkK WHERE [InköpsNr] = ' + orderId, function(err, recordset) {
        // Add the line items to the order
        order.OrderRader = recordset;
        getSupplier(order);
      });
    });
  };

  var getSupplier = function(order) {
    var supplierQuery = 'SELECT * FROM Lev WHERE [LevNr] = \'' + order.Levnr + '\'';
    var connection = new db.sql.Connection(db.supplier, function(err) {
      var request = new db.sql.Request(connection);
      request.query(supplierQuery, function(err, recordset) {
        // Add the supplier data to the order
        order.Leverantör = recordset[0];
        // Add metadata to the response
        response._metadata.responseTime = new Date().getTime() - response._metadata.responseTime + ' ms';
        // Add the order to the response
        response.response = order;
        // Send it to the client
        res.send(response);
      });
    });
  };

  var query = 'SELECT * FROM InkH WHERE [InköpsNr] =' + orderId + ';';
  var connection = new db.sql.Connection(db.supplier, function(err) {
    var request = new db.sql.Request(connection);
    request.query(query).then(function(recordset) {
      if (recordset.length > 0) {
        getLineItems(recordset[0]);
      } else {
        res.status(404).send({
          status: 404,
          message: "Couldn't find a purchase order with that number."
        });
      }
    }).catch(function(err) {
      // Log the error
      helpers.log({
        type: 'error',
        msg: 'Error when requesting a purchase order: ' + err,
        meta: {
          ip: req.ip,
          query: req.query
        }
      });
      res.send(err);
    });
  });
};

exports.update = function(req, res) {

  var data = req.body;
  var orderId = req.params.id;
  var set = 'SET ';
  var amount = Object.keys(data).length;
  var index = 0;

  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      index++;
      var value = (typeof data[key] == 'string') ? '\'' + data[key] + '\'' : data[key];
      set = set + key + " = " + value;
      if (amount > 1 && index < amount) {
        set = set + ', ';
      }
    }
  }

  var query = 'UPDATE InkH ' +
              set + ' ' +
              'WHERE InköpsNr = ' + orderId;

  var connection = new db.sql.Connection(db.supplier, function(err) {
    var request = new db.sql.Request(connection);
    request.query(query).then(function(recordset) {
      res.send('Successfully updated purchase order ' + orderId);
      helpers.log({
        type: 'info',
        msg: 'Successfully updated purchase order: ' + orderId,
        meta: {
          ip: req.ip,
          query: query
        }
      });
    }).catch(function(err) {
      // Log the error
      helpers.log({
        type: 'error',
        msg: 'Error when updating purchase order: ' + err,
        meta: {
          ip: req.ip,
          query: query
        }
      });

      res.status(400).send({
        message: err
      });
    });
  });
};
