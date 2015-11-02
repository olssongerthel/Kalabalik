var helpers = require('../utils/helpers');

exports.index = function(req, res) {

  helpers.createIndex({
    endpoint: 'Purchase order line items',
    db: 'supplier',
    table: 'InkK',
    orderBy: 'InköpsNr DESC',
    request: req
  }, function(err, index){
    if (!err) {
      res.send(index);
    } else {
      res.send(err.message);
    }
  });

};
