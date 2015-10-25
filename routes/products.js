var helpers = require('../utils/helpers');

exports.index = function(req, res) {

  helpers.createIndex({
    endpoint: 'Products',
    db: 'invoicing',
    table: 'Art',
    orderBy: 'RevideradDag DESC',
    request: req
  }, function(err, index){
    if (!err) {
      res.send(index);
    } else {
      res.send(err.message);
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
      res.send(entity);
    }
    else if (!err && !entity) {
      res.status(404).send({
      status: 404,
      message: "Couldn't find any products with that SKU."
    });
    }
    else {
      res.send(err.message);
    }
  });

};
