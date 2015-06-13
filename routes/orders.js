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
  // Only grab the top 20 unless explicitly told otherwise.
  var top = req.query.top ? req.query.top : 20;
  // Build the query
  var query = 'SELECT TOP ' + top + ' * FROM [dbo].[FaktH] ' + helpers.filter(req.query) + ';';
  // Connect to the database
  var connection = new db.sql.Connection(db.config, function(err) {
    var request = new db.sql.Request(connection);
    request.query(query).then(function(recordset) {
      res.send(recordset);
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

// Statuses:
// 3 = Plocka
// 5 = Faktura
