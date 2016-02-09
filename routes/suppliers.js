var helpers = require('../utils/helpers');

exports.index = function(req, res) {

  helpers.createIndex({
    endpoint: 'Suppliers',
    db: 'supplier',
    table: 'Lev',
    orderBy: req.query.orderBy ? req.query.orderBy : 'LevNr',
    orderDirection: req.query.direction ? req.query.direction : 'ASC',
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

  var levNr = req.params.id;

  helpers.entityQuery({
    entity: 'Supplier',
    db: 'supplier',
    table: 'Lev',
    baseProperty: 'LevNr',
    id: levNr,
    request: req,
    attach: [
      {
        db: 'supplier',
        table: 'InkH',
        baseProperty: 'Levnr',
        value: 'LevNr',
        attachTo: 'InköpsOrdrar',
        multiple: true
      }
    ]
  }, function(err, entity){
    if (!err && entity) {
      res.jsonp(entity);
    }
    else if (!err && !entity) {
      res.status(404).send({
      status: 404,
      message: "Couldn't find a supplier with that ID."
    });
    }
    else {
      res.jsonp(err.message);
    }
  });

};
