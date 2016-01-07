// Require modules
var express = require('express'),
    passport = require('passport');
    Strategy = require('passport-http').BasicStrategy;
    bodyParser = require('body-parser');

// Require settings and helpers
var settings = require('./config/config'),
    helpers = require('./utils/helpers');

// Require views
var orders = require('./routes/orders'),
    orderHistory = require('./routes/order-history'),
    lineItems = require('./routes/line-items'),
    customers = require('./routes/customers'),
    products = require('./routes/products'),
    stock = require('./routes/stock'),
    suppliers = require('./routes/suppliers'),
    purchaseOrders = require('./routes/purchase-orders'),
    purchaseOrderLineItems = require('./routes/purchase-order-line-items');

var app = express();

// Set content type to JSON for all requests.
app.use(function (req, res, next) {
  // CORS settings
  if (settings.cors) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "PUT, GET");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  }
  next();
});

// Configure Basic Authentication via Passport.
passport.use(new Strategy({ qop: 'auth' },
  function(username, password, cb) {
    helpers.authenticate(username, function(err, user) {
      if (err) {
        return cb(err);
      }
      if (!user) {
        return cb(null, false);
      }
      if (user['Lösenord'] != password) {
        return cb(null, false);
      }
      return cb(null, user);
    })
  }));

// Tell Express to use Passport.
app.use(passport.authenticate('basic', {session: false}));

// Use json bodyparser for PUT and POST requests.
app.use(bodyParser.json());

/**
 * Generates the front page welcome message and endpoints list.
 */
var welcome = function(req, res) {

  var message = 'Kalabalik is up and running.';
  // Create an array that we can store all endpoints in
  var endPoints = [];
  if (req) {
    var baseUrl = req.protocol + '://' + req.get('host');

    // Invoicing endpoints
    if (settings.mssql.databases.invoicing) {
      endPoints.push({
        name: 'Orders',
        url: baseUrl + '/orders',
        type: 'GET'
      },
      {
        name: 'Order',
        url: baseUrl + '/orders/:ORDER-ID',
        type: 'GET, PUT'
      },
      {
        name: 'Order history',
        url: baseUrl + '/order-history',
        type: 'GET'
      },
      {
        name: 'Order history order',
        url: baseUrl + '/order-history/:ORDER-ID',
        type: 'GET'
      },
      {
        name: 'Line items',
        url: baseUrl + '/line-items',
        type: 'GET'
      },
      {
        name: 'Line items per order',
        url: baseUrl + '/line-items/:ORDER-ID',
        type: 'GET'
      },
      {
        name: 'Line item',
        url: baseUrl + '/line-items/:ORDER-ID/:ROW',
        type: 'GET, PUT'
      },
      {
        name: 'Customers',
        url: baseUrl + '/customers',
        type: 'GET'
      },
      {
        name: 'Customer',
        url: baseUrl + '/customers/:CUSTOMER-ID',
        type: 'GET, PUT'
      },
      {
        name: 'Products',
        url: baseUrl + '/products',
        type: 'GET'
      },
      {
        name: 'Product',
        url: baseUrl + '/products/:SKU',
        type: 'GET'
      },
      {
        name: 'Stock status',
        url: baseUrl + '/stock',
        type: 'GET'
      });
    };

    // Supplier endpoints
    if (settings.mssql.databases.supplier) {
      endPoints.push({
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
        url: baseUrl + '/purchase-orders/:ORDER-ID',
        type: 'GET, PUT'
      },
      {
        name: 'Purchase order line items',
        url: baseUrl + '/purchase-order-line-items',
        type: 'GET'
      },
      {
        name: 'Purchase order line items per order',
        url: baseUrl + '/purchase-order-line-items/:ORDER-ID',
        type: 'GET'
      },
      {
        name: 'Purchase order line item',
        url: baseUrl + '/purchase-order-line-items/:ORDER-ID/:ROW',
        type: 'GET, PUT'
      });
    };

    res.jsonp({
      message: message,
      endPoints: endPoints
    });
  } else {
    return message;
  }
};

if (settings.mssql.databases.invoicing) {
  app.get('/orders', orders.index);
  app.route('/orders/:id')
    .get(orders.findById)
    .put(orders.update);
  app.get('/order-history', orderHistory.index);
  app.get('/order-history/:id', orderHistory.findById);
  app.get('/line-items', lineItems.index);
  app.get('/line-items/:order', lineItems.findByOrder);
  app.route('/line-items/:order/:row')
    .get(lineItems.findByOrderAndRow)
    .put(lineItems.update);
  app.get('/customers', customers.index);
  app.route('/customers/:id')
    .get(customers.findById)
    .put(customers.update);
  app.get('/products', products.index);
  app.get('/products/:sku', products.findBySKU);
  app.get('/stock', stock.index);
}

if (settings.mssql.databases.supplier) {
  app.get('/suppliers', suppliers.index);
  app.route('/suppliers/:id')
    .get(suppliers.findById);
  app.get('/purchase-orders', purchaseOrders.index);
  app.route('/purchase-orders/:id')
    .get(purchaseOrders.findById)
    .put(purchaseOrders.update);
  app.get('/purchase-order-line-items', purchaseOrderLineItems.index);
  app.get('/purchase-order-line-items/:order', purchaseOrderLineItems.findByOrder);
  app.route('/purchase-order-line-items/:order/:row')
    .get(purchaseOrderLineItems.findByOrderAndRow)
    .put(purchaseOrderLineItems.update);
}

app.get('', welcome);

// Initiate server
app.listen(settings.port);

helpers.log({
  level: 'info',
  msg: welcome()
});
