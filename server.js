var express = require('express'),
    basicAuth = require('basic-auth-connect'),
    bodyParser = require('body-parser'),
    settings = require('./config/settings'),
    orders = require('./routes/orders'),
    lineItems = require('./routes/line-items'),
    customers = require('./routes/customers'),
    products = require('./routes/products'),
    stock = require('./routes/stock'),
    suppliers = require('./routes/suppliers'),
    purchaseOrders = require('./routes/purchase-orders');

var app = express();

// Basic authenticator.
if (settings.credentials.username) {
  app.use(basicAuth(settings.credentials.username, settings.credentials.password));
}

// Use json bodyparser for PUT and POST requests.
app.use(bodyParser.json());

var welcome = function(req, res) {
  var message = 'Kalabalik is up and running.';
  if (req) {
    var baseUrl = req.protocol + '://' + req.get('host');
    res.send({
      message: message,
      endPoints: [
        {
          name: 'Orders',
          url: baseUrl + '/orders',
          type: 'GET'
        },
        {
          name: 'Order',
          url: baseUrl + '/orders/ORDER-ID',
          type: 'GET'
        },
        {
          name: 'Line items',
          url: baseUrl + '/line-items',
          type: 'GET'
        },
        {
          name: 'Customers',
          url: baseUrl + '/customers',
          type: 'GET'
        },
        {
          name: 'Products',
          url: baseUrl + '/products',
          type: 'GET'
        },
        {
          name: 'Product',
          url: baseUrl + '/products/SKU',
          type: 'GET'
        },
        {
          name: 'Stock status',
          url: baseUrl + '/stock',
          type: 'GET'
        },
        {
          name: 'Suppliers',
          url: baseUrl + '/suppliers',
          type: 'GET'
        },
        {
          name: 'Purchase orders',
          url: baseUrl + '/purchase-orders',
          type: 'GET'
        },
        {
          name: 'Purchase order',
          url: baseUrl + '/purchase-orders/ORDER-ID',
          type: 'GET, PUT'
        }
      ]
    });
  } else {
    return message;
  }
};

app.get('/orders', orders.findAll);
app.get('/orders/:id', orders.findById);
app.get('/line-items', lineItems.findAll);
app.get('/customers', customers.findAll);
app.get('/customers/:id', customers.findById);
app.get('/products', products.findAll);
app.get('/products/:sku', products.findBySKU);
app.get('/stock', stock.stock);
app.get('/suppliers', suppliers.findAll);
app.get('/purchase-orders', purchaseOrders.findAll);
app.route('/purchase-orders/:id')
  .get(purchaseOrders.findById)
  .put(purchaseOrders.update);
app.get('', welcome);

app.listen(settings.port);
console.log(welcome());
