var helpers = require('../utils/helpers');

exports.index = function(req, res) {

  helpers.createIndex({
    endpoint: 'Order history',
    db: 'invoicing',
    table: 'FaktHstH',
    orderBy: req.query.orderBy ? req.query.orderBy : 'Orderdatum',
    orderDirection: req.query.direction,
    fields: req.query.fields,
    request: req
  }, function(err, index){
    if (!err) {
      res.jsonp(index);
    } else {
      res.jsonp(err.message);
    }
  });

};

exports.findById = function(req, res) {

  var invoiceID = req.params.id;

  // Make sure we're getting an integer as order ID.
  if (invoiceID % 1 !== 0) {
    res.status(400).send({
      status: 400,
      message: "Please supply a valid invoice / receipt number."
    });
  }

  helpers.entityQuery({
    entity: 'Order history',
    db: 'invoicing',
    table: 'FaktHstH',
    baseProperty: 'FakturaNr',
    id: invoiceID,
    request: req,
    attach: [
      {
        db: 'invoicing',
        table: 'Kund',
        baseProperty: 'Kundnr',
        attachTo: 'Kund',
        multiple: false
      },
      {
        db: 'invoicing',
        table: 'FaktHstK',
        baseProperty: 'FakturaNr',
        attachTo: 'OrderRader'
      }
    ]
  }, function(err, entity){
    if (!err && entity) {
      res.jsonp(entity);
    }
    else if (!err && !entity) {
      res.status(404).send({
      status: 404,
      message: "Couldn't find a receipt / invoices for that order ID."
    });
    }
    else {
      res.jsonp(err.message);
    }
  });

};
