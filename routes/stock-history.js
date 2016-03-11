var helpers = require('../utils/helpers');

exports.index = function(req, res) {

  helpers.createIndex({
    endpoint: 'Stock history',
    db: 'invoicing',
    table: 'LagerHst',
    orderBy: 'Datum DESC, Tid',
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
