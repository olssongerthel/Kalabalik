var db = require('../config/config'),
    helpers = require('../utils/helpers');

exports.index = function(req, res) {

  helpers.createIndex({
    endpoint: 'Customers',
    db: 'invoicing',
    table: 'Kund',
    orderBy: 'KundNr DESC',
    request: req
  }, function(err, index){
    if (!err) {
      res.send(index);
    } else {
      res.send(err.message);
    }
  });

};

