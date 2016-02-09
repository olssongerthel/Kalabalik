var helpers = require('../utils/helpers');

exports.index = function(req, res) {

  helpers.createIndex({
    endpoint: 'Stock',
    db: 'invoicing',
    table: 'LagerSaldo',
    orderBy: req.query.orderBy ? req.query.orderBy : 'Rörelsedatum',
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
