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
      res.send(index);
    } else {
      res.send(err.message);
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
      }
    ]
  }, function(err, entity){
    if (!err && entity) {
      res.send(entity);
    }
    else if (!err && !entity) {
      res.status(404).send({
      status: 404,
      message: "Couldn't find any customers with that ID."
    });
    }
    else {
      res.send(err.message);
    }
  });

};
