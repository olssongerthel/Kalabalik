var helpers = require('../utils/helpers');

exports.index = function(req, res) {

  helpers.createIndex({
    endpoint: 'Line items',
    db: 'invoicing',
    table: 'FaktK',
    orderBy: req.query.orderBy ? req.query.orderBy : 'Ordernr',
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

exports.findByOrder = function(req, res) {

  helpers.entityQuery({
    entity: 'Line item',
    db: 'invoicing',
    table: 'FaktK',
    baseProperty: 'Ordernr',
    id: req.params.order,
    request: req,
    multiple: true
  }, function(err, entity){
    if (!err && entity.response.length > 0) {
      res.jsonp(entity);
    }
    else if (!err && entity.response.length === 0) {
      res.status(404).send({
      status: 404,
      message: "Couldn't find any line items belonging to an order with that ID."
    });
    }
    else {
      res.jsonp(err.message);
    }
  });
};

exports.findByOrderAndRow = function(req, res) {

  helpers.entityQuery({
    entity: 'Line item',
    db: 'invoicing',
    table: 'FaktK',
    baseProperty: 'Ordernr',
    secondaryProperty: 'Rad',
    id: req.params.order,
    secondaryValue: req.params.row,
    request: req
  }, function(err, entity){
    if (!err && entity.response) {
      res.jsonp(entity);
    }
    else if (!err && !entity.response) {
      res.status(404).send({
      status: 404,
      message: "Couldn't find any line item belonging to an order with that ID and using that row number."
    });
    }
    else {
      res.jsonp(err.message);
    }
  });
};

exports.update = function(req, res) {

  helpers.updateEntity({
    entity: 'Line item',
    db: 'invoicing',
    table: 'FaktK',
    baseProperty: 'Ordernr',
    secondaryProperty: 'Rad',
    secondaryValue: req.params.row,
    id: req.params.order,
    data: req.body,
    parent: {
      id: req.params.order,
      baseProperty: 'Ordernr',
      table: 'FaktH'
    }
  }, function(response) {
    res.status(response.status).send(response);
  });

};
