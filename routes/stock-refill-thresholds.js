var helpers = require('../utils/helpers')

exports.index = function (req, res) {
  helpers.createIndex(
    {
      endpoint: 'Stock refill thresholds',
      db: 'invoicing',
      table: 'ArtBestPunkt',
      orderBy: req.query.orderBy ? req.query.orderBy : 'ArtikelNr',
      orderDirection: req.query.direction,
      fields: req.query.fields,
      request: req
    },
    function (err, index) {
      if (!err) {
        res.jsonp(index)
      } else {
        res.status(500).jsonp({
          status: 500,
          message: err.message
        })
      }
    }
  )
}
