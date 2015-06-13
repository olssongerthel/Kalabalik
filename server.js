var express = require('express'),
    articles = require('./routes/articles'),
    orders = require('./routes/orders');

var app = express();

var welcome = function(req, res) {
  var message = 'Your FDT Avance REST server is up and running.';
  if (req) {
    res.send({
      Message: message
    });
  } else {
    return message;
  }
};

app.get('/articles', articles.findAll);
app.get('/articles/:sku', articles.findBySKU);
app.get('/orders', orders.findAll);
app.get('/orders/:id', orders.findById);
app.get('', welcome);

app.listen(3000);
console.log(welcome());
