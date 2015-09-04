var express = require('express'),
    basicAuth = require('basic-auth-connect'),
    settings = require('./config/settings'),
    orders = require('./routes/orders'),
    lineItems = require('./routes/line-items'),
    customers = require('./routes/customers'),
    products = require('./routes/products'),
    stock = require('./routes/stock');

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
          name: 'Line items',
          url: '/line-items',
          type: 'GET'
        },
        {
          name: 'Customers',
          url: '/customers',
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
        },
        {
          name: 'Stock status',
          url: '/stock',
          type: 'GET'
        }
      ]
    });
  } else {
    return message;
  }
};

// Basic authenticator
if (settings.credentials.username) {
  app.use(basicAuth(settings.credentials.username, settings.credentials.password));
}

app.get('/orders', orders.findAll);
app.get('/orders/:id', orders.findById);
app.get('/line-items', lineItems.findAll);
app.get('/customers', customers.findAll);
app.get('/products', products.findAll);
app.get('/products/:sku', products.findBySKU);
app.get('/stock', stock.stock);
app.get('', welcome);

app.listen(settings.port);
console.log(welcome());
