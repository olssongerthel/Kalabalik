var helpers = require('../utils/helpers');

exports.index = function(req, res) {

  helpers.createIndex({
    endpoint: 'Suppliers',
    db: 'supplier',
    table: 'Lev',
    orderBy: 'LevNr ASC',
    request: req
  }, function(err, index){
    if (!err) {
      res.jsonp(index);
    } else {
      res.jsonp(err.message);
    }
  });

};
