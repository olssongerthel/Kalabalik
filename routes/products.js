var helpers = require('../utils/helpers');

exports.index = function(req, res) {

  helpers.createIndex({
    endpoint: 'Products',
    db: 'invoicing',
    table: 'Art',
    orderBy: req.query.orderBy ? req.query.orderBy : 'RevideradDag',
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

exports.findBySKU = function(req, res) {

  var sku = req.params.sku;

  helpers.entityQuery({
    entity: 'Product',
    db: 'invoicing',
    table: 'Art',
    baseProperty: 'ArtikelNr',
    id: sku,
    request: req,
    attach: [
      {
        db: 'invoicing',
        table: 'LagerSaldo',
        baseProperty: 'ArtikelNr',
        attachTo: 'Lagersaldo'
      },
      {
        db: 'invoicing',
        table: 'ArtLev',
        baseProperty: 'ArtikelNr',
        attachTo: 'Leverantör'
      }
    ]
  }, function(err, entity){
    if (!err && entity) {
      res.jsonp(entity);
    }
    else if (!err && !entity) {
      res.status(404).send({
      status: 404,
      message: "Couldn't find any products with that SKU."
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
    entity: 'Product',
    db: 'invoicing',
    table: 'Art',
    baseProperty: 'ArtikelNr',
    id: req.params.sku,
    data: req.body
  }, function(response) {
    res.status(response.status).send(response);
  });

};
