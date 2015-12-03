var helpers = require('../utils/helpers');

exports.index = function(req, res) {

  helpers.createIndex({
    endpoint: 'Suppliers',
    db: 'supplier',
    table: 'Lev',
    orderBy: req.query.orderBy ? req.query.orderBy : 'LevNr',
    orderDirection: req.query.direction ? req.query.direction : 'ASC',
    request: req
  }, function(err, index){
    if (!err) {
      res.jsonp(index);
    } else {
      res.jsonp(err.message);
    }
  });

};
