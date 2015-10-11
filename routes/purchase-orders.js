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

  var orderId = req.params.id;

  // Make sure we're getting an integer as order ID.
  if (orderId % 1 !== 0) {
    res.status(400).send({
      status: 400,
      message: "Please supply a valid order number."
    });
  }

  helpers.entityQuery({
    entity: 'Order',
    db: 'supplier',
    table: 'InkH',
    baseProperty: 'InköpsNr',
    id: orderId,
    request: req,
    attach: [
      {
        db: 'supplier',
        table: 'InkK',
        baseProperty: 'InköpsNr',
        attachTo: 'OrderRader'
      },
      {
        db: 'supplier',
        table: 'Lev',
        baseProperty: 'LevNr',
        value: 'Levnr',
        attachTo: 'Leverantör'
      }
    ]
  }, function(err, entity){
    if (!err && entity) {
      res.send(entity);
    }
    else if (!err && !entity) {
      res.status(404).send({
      status: 404,
      message: "Couldn't find any purchase orders with that ID."
    });
    }
    else {
      res.send(err.message);
    }
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
