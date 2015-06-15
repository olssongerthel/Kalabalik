var express = require('express'),
    settings = require('./config/settings'),
    products = require('./routes/products'),
    orders = require('./routes/orders');

var app = express();

var welcome = function(req, res) {
  var message = 'Kalabalik is up and running.';
  if (req) {
    res.send({
      message: message,
      endPoints: [
        {
          name: 'Orders',
          url: '/orders',
          type: 'GET'
        },
        {
          name: 'Order',
          url: '/orders/ORDERID',
          type: 'GET'
        },
        {
          name: 'Products',
          url: '/products',
          type: 'GET'
        },
        {
          name: 'Product',
          url: '/products/SKU',
          type: 'GET'
        }
      ]
    });
  } else {
    return message;
  }
};

app.get('/products', products.findAll);
app.get('/products/:sku', products.findBySKU);
app.get('/orders', orders.findAll);
app.get('/orders/:id', orders.findById);
app.get('', welcome);

app.listen(settings.port);
console.log(welcome());
