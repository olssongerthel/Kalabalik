var helpers = require('../utils/helpers');

exports.index = function(req, res) {

  helpers.createIndex({
    endpoint: 'Customers',
    db: 'invoicing',
    table: 'Kund',
    orderBy: 'KundNr DESC',
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

  var customerId = req.params.id;

  helpers.entityQuery({
    entity: 'Customer',
    db: 'invoicing',
    table: 'Kund',
    baseProperty: 'KundNr',
    id: customerId,
    request: req,
    attach: [
      {
        db: 'invoicing',
        table: 'FaktH',
        baseProperty: 'Kundnr',
        attachTo: 'Ordrar'
      },
      {
        db: 'invoicing',
        table: 'FaktHstH',
        baseProperty: 'Kundnr',
        attachTo: 'OrderHistorik'
      }
    ]
  }, function(err, entity){
    if (!err && entity) {
      res.jsonp(entity);
    }
    else if (!err && !entity) {
      res.status(404).send({
      status: 404,
      message: "Couldn't find any customers with that ID."
    });
    }
    else {
      res.jsonp(err.message);
    }
  });

};

exports.update = function(req, res) {

  helpers.updateEntity({
    entity: 'Customer',
    db: 'invoicing',
    table: 'Kund',
    baseProperty: 'KundNr',
    id: req.params.id,
    data: req.body
  }, function(response) {
    res.status(response.status).send(response);
  });

};
