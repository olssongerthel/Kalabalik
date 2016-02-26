var db = require('../config/config'),
    helpers = require('../utils/helpers');

exports.index = function(req, res) {

  helpers.createIndex({
    endpoint: 'Purchase orders',
    db: 'supplier',
    table: 'InkH',
    orderBy: req.query.orderBy ? req.query.orderBy : 'Orderdatum',
    orderDirection: req.query.direction,
    fields: req.query.fields,
    request: req
  }, function(err, index){
    if (!err) {
      res.jsonp(index);
    } else {
      res.status(500).jsonp({
        status: 500,
        message: err.message
      });
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
    entity: 'Purchase Order',
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
        attachTo: 'Leverantör',
        multiple: false
      }
    ]
  }, function(err, entity){
    if (!err && entity) {
      res.jsonp(entity);
    }
    else if (!err && !entity) {
      res.status(404).send({
      status: 404,
      message: "Couldn't find any purchase orders with that ID."
    });
    }
    else {
      res.status(500).jsonp({
        status: 500,
        message: err.message
      });
    }
  });

};

exports.update = function(req, res) {

  helpers.updateEntity({
    entity: 'Purchase order',
    db: 'supplier',
    table: 'InkH',
    baseProperty: 'InköpsNr',
    id: req.params.id,
    data: req.body
  }, function(response) {
    res.status(response.status).send(response);
  });

};
