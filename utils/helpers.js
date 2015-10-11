var db = require('../config/config'),
    pagination = require('pagination'),
    winston = require('winston');

winston.add(winston.transports.File, { filename: 'log/kalabalik.log' });

exports.log = function(data) {
  winston.log(data.type, data.msg, data.meta);
};
/**
 * Produces a valid SQL filter string based on URL params.
 * @param  {string}   params - A Kalabalik URL filter string.
 * @return {object}   An object containing the filter string and information
 * about it.
 */
exports.filter = function(params) {
  var filter = {};

  // Turn the pipe delimited filter into an object for easier processing.
  var result = [];

  params.split('|').forEach(function(x){
    result.push(x);
  });
  params = result;
  filter.params = params;

  // Bail if there are no filters
  if (params.length === 0) {
    return;
  }

  filter.string = 'WHERE ';
  var amount = Object.keys(params).length;
  var index = 0;

  for (var i = 0; i < result.length; i++) {
    index++;
    filter.string = filter.string + result[i];
    if (amount > 1 && index < amount) {
      filter.string = filter.string + ' AND ';
    }
  }

  // Turn double quotes into singles quotes to avoid SQL errors.
  filter.string = filter.string.replace(/"/gi, '\'');

  return filter;
};

exports.ListMetadata = function(req) {
  var metadata = {};
  metadata.responseTime = new Date().getTime();
  metadata.totalCount = false;
  metadata.from = false;
  metadata.to = false;
  metadata.currentPage = req.query.page ? parseInt(req.query.page) : 1;
  metadata.lastPage = false;
  metadata.perPage = (req.query.perPage <= 10000) ? parseInt(req.query.perPage) : 25;
  metadata.links = {};
  metadata.filters = false;
  return metadata;
};

exports.ListMetadata.buildPager = function(metadata, req, results) {
  var baseUrl = req.protocol + '://' + req.get('host');

  if (!req.query.page) {
    req.query.page = 1;
    req.url = (req.query.filter || req.query.perPage || req.query.orderBy) ? req.url + '&page=1' : req.url + '?page=1';
  }

  var paginator = pagination.create('search', {
    prelink:'/',
    current: req.query.page,
    rowsPerPage: metadata.perPage,
    totalResult: metadata.totalCount
  });

  pageData = paginator.getPaginationData();

  metadata.from = pageData.fromResult;
  metadata.to = pageData.toResult;
  metadata.lastPage = pageData.pageCount;

  metadata.links = {
    self: pageData.current ? baseUrl + req.url.replace(/\page=[0-9]+/, 'page=' + pageData.current) : false,
    first: pageData.first ? baseUrl + req.url.replace(/\page=[0-9]+/, 'page=' + pageData.first) : baseUrl + req.url.replace(/\page=[0-9]+/, 'page=' + 1),
    previous: pageData.previous ? baseUrl + req.url.replace(/\page=[0-9]+/, 'page=' + pageData.previous) : false,
    next: pageData.next ? baseUrl + req.url.replace(/\page=[0-9]+/, 'page=' + pageData.next) : false,
    last: pageData.pageCount ? baseUrl + req.url.replace(/\page=[0-9]+/, 'page=' + pageData.pageCount) : false,
  };

  return metadata;
};

exports.SingleMetadata = function() {
  var metadata = {};
  metadata.responseTime = new Date().getTime();
  return metadata;
};

exports.PaginatedQuery = function(options) {
  options.filter = options.filter ? options.filter : '';
  var query = 'SELECT * ' +
              'FROM (' +
                'SELECT ROW_NUMBER() OVER (ORDER BY ' + options.orderBy + ') AS RowNum, *' +
                'FROM ' + options.table + ' ' +
                options.filter +
                ') AS RowConstrainedResult' +
              ' WHERE RowNum >' + options.meta.perPage * (options.meta.currentPage - 1) +
                ' AND RowNum <= ' + options.meta.perPage * options.meta.currentPage +
              ' ORDER BY RowNum';
  return query;
};

/**
 * Callback for createIndex.
 *
 * @callback createIndexCallback
 * @param {string} err - An error message, if any.
 * @param {object} index - The complete index including metadata.
 */

/**
 * Performs a paginated data request on a given database table.
 * @param  {object}   options
 * @param  {string}   options.endpoint - The name of the endpoint, i.e 'Orders'
 * @param  {string}   options.db - The database to use. Use the same
 * variables that are used in the config file.
 * @param  {string}   options.table - The table to query.
 * @param  {string}   options.orderBy - The column and direction to order by as
 * a valid SQL string, i.e. 'Orderdatum DESC' or 'ArtikelNr ASC'.
 * @param  {object}   options.request - An Express req object.
 * 'WHERE ArtikelNr = "123"' or equivalent. Use the filter() helper.
 * @param  {createIndexCallback} callback
 */
exports.createIndex = function(options, callback) {

  var index = {};
  var filter = options.request.query.filter ? exports.filter(options.request.query.filter) : '';
  var meta = exports.ListMetadata(options.request);
  meta.filters = filter.params;

  console.log(filter);

  // Log the request
  exports.log({
    type: 'info',
    msg: 'Request for ' + options.endpoint,
    meta: {
      ip: options.request.ip,
      query: options.request.query
    }
  });

  // Perform a count request in order to get the total
  // amount of results.
  exports.countQuery({
    db: options.db,
    table: options.table,
    where: filter.string,
  }, function(err, recordset) {
    if (!err) {
      // Add the count request results to the metadata.
      meta.totalCount = recordset[0][''];
      paginatedReq();
    } else {
      callback(err, index);
    }
  });

  // Create a paginated query string
  var query = exports.PaginatedQuery({
    table: options.table,
    orderBy: options.orderBy,
    filter: filter.string,
    meta: meta
  });

  // Perform the paginated request
  var paginatedReq = function() {
    exports.dbRequest({
      db: options.db,
      query: query
    }, function(err, recordset) {
      if (!err) {
        httpBody(recordset);
      } else {
        callback(err, index);
      }
    });
  };

  // Combine everything in one index object and return it
  var httpBody = function(data) {
    // Add metadata
    index._metadata = exports.ListMetadata.buildPager(meta, options.request, data);
    index._metadata.responseTime = new Date().getTime() - index._metadata.responseTime + ' ms';
    // Add the data to the index.
    index.response = data;
    var err = null;
    callback(err, index);
  };

};

/**
 * Callback for dbRequest.
 *
 * @callback dbRequestCallback
 * @param {String} err - An error message, if any.
 * @param {Object} recordset - The data returned by the query.
 */

/**
 * Performs a paginated data request on a given database table.
 * @param  {Object}   options
 * @param  {String}   options.db - The database to use. Use the same
 * variables that are used in the config file.
 * @param  {String}   options.query - The complete paginated db query.
 * @param  {dbRequestCallback} callback
 */
exports.dbRequest = function(options, callback) {

  switch(options.db) {
    case 'supplier':
      cred = db.supplier;
      break;
    case 'invoicing':
      cred = db.invoicing;
      break;
  }

  // Connect to the database
  var connection = new db.sql.Connection(cred, function(err) {
    // Fetch the requested data
    var request = new db.sql.Request(connection);
    request.query(options.query).then(function(recordset) {
      var err = null;
      // Send to the client
      callback(err, recordset);
    }).catch(function(err) {
      // Log the error
      exports.log({
        type: 'error',
        msg: 'Error when requesting data: ' + err,
        meta: {
          query: options.query
        }
      });
      callback(err, recordset);
    });
  });
};

/**
 * Callback for countQuery.
 *
 * @callback countCallback
 * @param {String} err - An error message, if any.
 * @param {Object} recordset - The data returned by the query.
 */

/**
 * Performs a count on a given database table.
 * @param  {Object}   options
 * @param  {String}   options.db - The database to use. Use the same
 * variables that are used in the config file.
 * @param  {String}   options.table - The database table to query.
 * @param  {String}   [options.filter] - A possible 'WHERE' clause.
 * @param  {countCallback} callback
 */
exports.countQuery = function(options, callback) {

  var query = 'SELECT COUNT(*) FROM ' + options.table;

  // Add the 'WHERE' clause to the query if it's there.
  query = options.where ? query + ' ' + options.where : query;

  switch(options.db) {
    case 'supplier':
      cred = db.supplier;
      break;
    case 'invoicing':
      cred = db.invoicing;
      break;
  }

  // Connect to the database
  var connection = new db.sql.Connection(cred, function(err) {
    // Perform a total row count in order to create a paginated result.
    var countRequest = new db.sql.Request(connection);
    countRequest.query(query).then(function(recordset) {
      var err = null;
      callback(err, recordset);
    }).catch(function(err) {
      // Log the error
      exports.log({
        type: 'error',
        msg: 'Error when counting: ' + err,
        meta: {
          error: err,
          query: query
        }
      });
      recordset = null;
      callback(err, recordset);
    });
  });
};
