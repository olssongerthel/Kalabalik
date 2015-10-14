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
 * @param  {string}   options.endpoint - The name of the entity, i.e 'Orders'
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
    exports.indexRequest({
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
 * Callback for indexRequest.
 *
 * @callback indexRequestCallback
 * @param {String} err - An error message, if any.
 * @param {Object} recordset - The data returned by the query.
 */

/**
 * Performs a paginated data request on a given database table.
 * @param  {Object}   options
 * @param  {String}   options.db - The database to use. Use the same
 * variables that are used in the config file.
 * @param  {String}   options.query - The complete paginated db query.
 * @param  {indexRequestCallback} callback
 */
exports.indexRequest = function(options, callback) {

  var cred = exports.credentials(options.db);

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
  var cred = exports.credentials(options.db);

  // Connect to the database
  var connection = new db.sql.Connection(cred, function(err) {
    // Perform a total row count in order to create a paginated result.
    var countRequest = new db.sql.Request(connection);
    countRequest.query(query).then(function(recordset) {
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

/**
 * Callback for entityQuery.
 *
 * @callback entityQueryCallback
 * @param {string} err - An error message, if any.
 * @param {object} entity - The entity returned by the query, including any
 * attached content.
 */

/**
 * Performs a database query to extract a single entity such as an order.
 * @param  {object}   options
 * @param  {object}   options.entity - The name of the requested entity
 * type i.e. "Order" or "Customer" etc.
 * @param  {string}   options.db - The database to use. Use the same
 * variables that are used in the config file.
 * @param  {string}   options.table - The database table to query.
 * @param  {string}   options.baseProperty - The DB column that contains the
 * key value of the table row.
 * @param  {string/number}   options.id - The entity ID (KundNr or Ordernr etc.)
 * @param  {object}   options.request - An Express req object.
 * @param  {array}    [options.attach] - An array of objects that follow the
 * attach() objects requirements. Can be used to attach additional info to the
 * entity before it is returned in the callback.
 * @param  {entityQueryCallback} callback
 */
exports.entityQuery = function(options, callback) {

  var response = {};
  response._metadata = exports.SingleMetadata();

  // Log the request
  exports.log({
    type: 'info',
    msg: 'Request for single ' + options.entity,
    meta: {
      ip: options.request.ip,
      query: options.request.query
    }
  });

  var cred = exports.credentials(options.db);
  var id = exports.purger(options.baseProperty, options.id);
  var query = 'SELECT * FROM ' + options.table + ' WHERE ' + options.baseProperty + '=' + id + ';';

  // Connect to the database
  var connection = new db.sql.Connection(cred, function(err) {
    var request = new db.sql.Request(connection);
    request.query(query).then(function(recordset) {
      // Fetch additonal data if requested.
      if (options.attach.length && recordset.length > 0) {
        exports.attach(recordset[0], options.attach, function(entity){
          response.response = entity;
          response._metadata.responseTime = new Date().getTime() - response._metadata.responseTime + ' ms';
          callback(err, response);
        });
      } else {
        response._metadata.responseTime = new Date().getTime() - response._metadata.responseTime + ' ms';
        response,response = recordset[0];
        callback(err, response);
      }

    }).catch(function(err) {
      // Log the error
      exports.log({
        type: 'error',
        msg: 'Error when fetching single entity: ' + err,
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

/**
 * Callback for attach.
 *
 * @callback attachCallback
 * @param {object} entity - The entity along with its attached content.
 */

/**
 * Given an entity, such as an order or a customer, fetches additional data
 * and returns the entity with the additional data attached.
 * @param  {object}         entity - The base entity.
 * @param  {Array<Object>}  objects
 * @param  {string}         objects[*].db - The database to query.
 * @param  {string}         objects[*].table - The table to query.
 * @param  {string}         objects[*].baseProperty - The DB column that contains the
 * key value of the entity, used as reference for other queries.
 * @param  {string}         [objects[*].value] - The key name as string on the
 * base entity. Useful when the baseproperty isn't aligned with the columns.
 * @param  {string}         objects[*].attachTo - The property on the base entity
 * on which to attach the fetched data.
 * @param  {attachCallback} callback
 */
exports.attach = function(entity, objects, callback) {

  var countdown = objects.length;

  var request = function(options, cb) {
    var cred = exports.credentials(options.database);

    // Connect to the database
    var connection = new db.sql.Connection(cred, function(err) {

      var attachRequest = new db.sql.Request(connection);
      attachRequest.query(options.query).then(function(recordset) {
        cb(recordset, options.attachTo);
      }).catch(function(err) {
        // Failure
        exports.log({
          type: 'error',
          msg: 'Error when attaching: ' + err,
          meta: {
            error: err,
            query: options.query
          }
        });
      });

    });
  }

  // Loop through all of the requested extra data and query the database,
  // then add the content to the entity and return it via callback.
  for (var i = 0; i < objects.length; i++) {
    // Use value instead of base property if supplied
    var key = objects[i].value ? objects[i].value : objects[i].baseProperty;
    // Purge the entity ID
    var id = exports.purger(objects[i].baseProperty, entity[key]);
    // Create the query string
    var query = 'SELECT * FROM ' + objects[i].table + ' WHERE ' + objects[i].baseProperty + ' = ' + id;
    // Perform asynchronous DB requests to fetch the data
    request({
      query: query,
      attachTo: objects[i].attachTo,
      database: objects[i].db
    }, function(data, attachTo) {
      entity[attachTo] = data;
      countdown--;
      // Make sure that all reqests have been performed.
      if (countdown === 0) {
        // Return the entity in a callback
        callback(entity);
      }
    });

  }

};

/**
 * Callback for updateEntity.
 *
 * @callback updateEntityCallback
 * @param {object} response
 * @param {string} response.message - Success/Failure message.
 * @param {string} response.status - The HTTP status.
 */

/**
 * Updates an entity.
 * @param  {object}   options
 * @param  {string}   options.entity - The name of the entity type i.e.
 * "Order" or "Customer" etc.
 * @param  {string}   options.db - The database to query.
 * @param  {string}   options.table - The table to query.
 * @param  {string}   options.baseProperty - The DB column to match the id to.
 * @param  {string}   options.id - The entity id.
 * @param  {object}   options.data - JSON data containing the changes.
 * @param  {updateEntityCallback} callback
 */
exports.updateEntity = function(options, callback) {

  var response = {};

  // Purge the ID
  options.id = exports.purger(options.baseProperty, options.id);

  // Build a SET query string based on the data
  var set = 'SET ';
  var amount = Object.keys(options.data).length;
  var index = 0;

  for (var key in options.data) {
    if (options.data.hasOwnProperty(key)) {
      index++;
      var value = (typeof options.data[key] == 'string') ? '\'' + options.data[key] + '\'' : options.data[key];
      set = set + key + " = " + value;
      if (amount > 1 && index < amount) {
        set = set + ', ';
      }
    }
  }

  // Assemble the whole query
  var query = 'UPDATE ' + options.table + ' ' +
              set + ' ' +
              'WHERE ' + options.baseProperty + ' = ' + options.id;

  var cred = exports.credentials(options.db);

  // Perform the update
  var connection = new db.sql.Connection(cred, function(err) {
    var request = new db.sql.Request(connection);
    request.query(query).then(function(recordset) {
      // Success
      response.status = 200;
      response.message = 'Successfully updated ' + options.entity + ' ' + options.id;
      response.response = recordset;
      exports.log({
        type: 'info',
        msg: response.message,
        meta: {
          query: query
        }
      });
      callback(response);
    }).catch(function(err) {
      // Fail
      response.status = 400;
      response.message = 'Error when updating ' + options.entity + ' ' + options.id;
      response.error = err;
      exports.log({
        type: 'error',
        msg: response.message,
        meta: {
          query: query
        }
      });
      callback(response);
    });
  });

};

/**
 * Validates various entity IDs. Some system IDs in FDT are integers while some
 * are strings. This function helps keep track of which are which and silently
 * converts them to their proper type.
 * @param  {string}     property - The column name.
 * @param  {string/int} id - The ID to be purged.
 * @return {string/int} The entity ID as string or integer
 */
exports.purger = function(property, id) {
  switch(property) {
    case 'KundNr':
    case 'Kundnr':
    case 'ArtikelNr':
    case 'Artikelnr':
    case 'LevNr':
    case 'Levnr':
      return '\'' + id + '\'';
      break;
    default:
      return id;
  }
};

/**
 * Helper for a common need: To get the database credentials from the config
 * file by using the name of the database.
 */
exports.credentials = function(dbName) {
  switch(dbName) {
    case 'supplier':
      return db.supplier;
      break;
    case 'invoicing':
      return db.invoicing;
      break;
  }
};
