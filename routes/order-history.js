var helpers = require('../utils/helpers');

exports.index = function(req, res) {

  helpers.createIndex({
    endpoint: 'Order history',
    db: 'invoicing',
    table: 'FaktHstH',
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
    entity: 'Order history',
    db: 'invoicing',
    table: 'FaktHstH',
    baseProperty: 'InköpsNr',
    id: orderId,
    request: req,
    attach: [
      {
        db: 'invoicing',
        table: 'Kund',
        baseProperty: 'Kundnr',
        attachTo: 'Kund'
      },
      {
        db: 'invoicing',
        table: 'FaktHstK',
        baseProperty: 'Ordernr',
        attachTo: 'OrderRader'
      }
    ]
  }, function(err, entity){
    if (!err && entity) {
      res.send(entity);
    }
    else if (!err && !entity) {
      res.status(404).send({
      status: 404,
      message: "Couldn't find any orders with that ID."
    });
    }
    else {
      res.send(err.message);
    }
  });

};
