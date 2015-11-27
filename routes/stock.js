var helpers = require('../utils/helpers');

exports.index = function(req, res) {

  helpers.createIndex({
    endpoint: 'Stock',
    db: 'invoicing',
    table: 'LagerSaldo',
    orderBy: 'Rörelsedatum DESC',
    request: req
  }, function(err, index){
    if (!err) {
      res.jsonp(index);
    } else {
      res.jsonp(err.message);
    }
  });

};
