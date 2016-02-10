var config = require('../config/config'),
    sql = require('mssql'),
    pagination = require('pagination'),
    winston = require('winston');

// Default to using logfile if no other Winston transport has been selected.
if (!config.winstonTransport.module) {
  winston.add(winston.transports.File, { filename: 'log/kalabalik.log' });
} else {
  winston.add(config.winstonTransport.module, config.winstonTransport.options);
}

/**
 * Generates a log entry.
 *
 * Will only log error level messages unless debugging is enabled in config.
 *
 * @param  {Object} data - A Winston log object.
 * @param  {Object} data.meta
 * @param  {String} data.meta.plugin - The human readable name of your plugin,
 * i.e the same as exports.label from your plugin.
 */
exports.log = function(data) {
  data.level = data.level ? data.level : 'info';
  data.meta = data.meta ? data.meta : null;
  if ((data.level == 'info' && config.debug) || data.level == 'error') {
    winston.log(data.level, data.msg, data.meta);
  } else {
    return;
  }
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
    // Sanitize single quotes to prevent unclosed quotation mark after the string '
    result[i] = result[i].replace(/[']/g, "''")

    filter.string = filter.string + result[i];
    if (amount > 1 && index < amount) {
      filter.string = filter.string + ' AND ';
    }
  }

  // Turn double quotes into singles quotes to avoid SQL errors.
  filter.string = filter.string.replace(/"/gi, '\'');

  // Replace $ with %. This is needed because using % in the URL
  // will break the filter.
  filter.string = filter.string.replace(/\$/g, '%');

  return filter;
};

/**
 * Callback for subFilter.
 *
 * @callback subFilterCallback
 * @param {string} err - An error message, if any.
 * @param {object} list - An object containing the string.
 */

/**
 * Creates a subfilter query that can be used on its
 * own or be attached to an existing filter string.
 * The string should be formatted like so:
 * Ordernr[invoicing:FaktK:Ordernr][Benämning LIKE \'$string$\'];
 *
 * @param  {string} value - the URL query parameter from "subFilter" param.
 * @param  {subFilterCallback} callback
 */
exports.subFilter = function(params, callback) {

  // Turn the pipe delimited filter into an object for easier processing.
  var result = [];

  params.split('|').forEach(function(x){
    result.push(x);
  });

  // Convert params into an object since we don't need the original
  // format any longer and we need something to attach things to.
  params = {
    subFilters: result,
    string: ''
  };

  // Bail if there are no filters
  if (params.subFilters.length === 0) {
    callback('Attempted to create a subfilter with no values supplied.', null);
  }

  // Create a countdown integer
  var countdown = params.subFilters.length;
  var index = 0;

  // Loop through each subfilter parameter and create the 'where'
  // string for each one.
  for (var i = 0; i < params.subFilters.length; i++) {
    exports.subFilterLoop(params.subFilters[i], function(err, param) {
      if (!err) {
        index++;
        params.string = params.string + param.string;
        if (countdown > 1 && index < countdown) {
          params.string = params.string + ' AND ';
        }
        if (index === countdown) {
          callback(null, params);
        }
      } else {
        callback('An error occured within exports.subFilter()', null);
      }
    });
  }
};

exports.subFilterLoop = function(value, callback) {
  var param = {
    property: value.split('[')[0],
    db: value.split('[')[1].split(":")[0],
    table: value.split('[')[1].split(":")[1],
    column: value.split(']')[0].split(":")[2],
    where: value.match(/\[(.*?)\]/g)[1].replace(']', '').replace('[', '')
  };

  // Turn double quotes into singles quotes to avoid SQL errors.
  param.where = param.where.replace(/"/gi, '\'');

  // Replace $ with %. This is needed because using % in the URL
  // will break the filter.
  param.where = param.where.replace(/\$/g, '%');

  // Assemble the query string;
  var query = 'SELECT ' + param.property + ' FROM ' + param.table + ' WHERE ' + param.where;

  // Helper to elmininate duplicates from the results array.
  function eliminateDuplicates(arr) {
    var i,
        len=arr.length,
        out=[],
        obj={};

    for (i=0;i<len;i++) {
      obj[arr[i]]=0;
    }
    for (i in obj) {
      // Purge the value before adding it to the list
      i = exports.purger(param.column, i);
      out.push(i);
    }
    return out;
  }

  // Connect to the database
  var connection = new sql.Connection(exports.credentials(param.db), function(err) {
    // Fetch the requested data
    var request = new sql.Request(connection);
    request.query(query).then(function(recordset) {
      var err = null;
      // Convert the result into an array of single values
      var inList = [];
      for (var i = 0; i < recordset.length; i++) {
        inList.push(recordset[i][param.column]);
      }
      // Reduce dupes and convert the array to a string query
      inList = eliminateDuplicates(inList);
      param.string = param.column + ' IN (' + inList.join() + ')';
      // Return
      callback(err, param);
    }).catch(function(err) {
      callback(err, null);
    });
  });
};

exports.ListMetadata = function(req) {
  var metadata = {};
  metadata.responseTime = new Date().getTime();
  metadata.totalCount = false;
  metadata.from = false;
  metadata.to = false;
  metadata.currentPage = req.query.page ? parseInt(req.query.page) : 1;
  metadata.previousPage = false;
  metadata.nextPage = false;
  metadata.lastPage = false;
  metadata.perPage = (req.query.perPage <= 10000) ? parseInt(req.query.perPage) : 25;
  metadata.links = {};
  metadata.params = req.query;
  return metadata;
};

exports.ListMetadata.buildPager = function(metadata, req, results) {
  var baseUrl = req.protocol + '://' + req.get('host');

  if (!req.query.page) {
    req.query.page = 1;
    req.url = (req.query.filter || req.query.perPage || req.query.orderBy || req.query.subFilter || req.query.fields) ? req.url + '&page=1' : req.url + '?page=1';
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
  metadata.previousPage = pageData.previous;
  metadata.nextPage = pageData.next;
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

/**
 * Produces a valid SQL select column string.
 *
 * @param  {string}   string - A Kalabalik URL field string (pipe delimited)
 * @return {string}   - A valid SQL select column string.
 */
exports.fieldStringToSQL = function(fields) {
  var sqlString = fields.split('|');
  return sqlString;
};

exports.PaginatedQuery = function(options) {
  options.filter = options.filter ? options.filter : '';
  options.fields = options.fields ? exports.fieldStringToSQL(options.fields) : '*';
  var query = 'SELECT ' + options.fields + ' ' +
              'FROM (' +
                'SELECT ROW_NUMBER() OVER (ORDER BY ' + options.orderBy + ' ' + options.orderDirection +') AS RowNum, *' +
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
 * @param  {string}   options.orderBy - The property to order by.
 * @param  {string}   [options.fields] - The properties/fields to display.
 * Defaults to * (i.e. all fields) if not specified.
 * @param  {string}   [options.orderDirection] - The direction to order by.
 * Defaults to DESC.
 * @param  {object}   options.request - An Express req object.
 * @param  {createIndexCallback} callback
 */
exports.createIndex = function(options, callback) {

  // Default to DESC ordering
  options.orderDirection = options.orderDirection ? options.orderDirection : 'DESC';

  var index = {};
  var filter = options.request.query.filter ? exports.filter(options.request.query.filter) : {};
  var subFilter = options.request.query.subFilter ? options.request.query.subFilter : '';

  var meta = exports.ListMetadata(options.request);

  // Add filter parameters to the response metadata
  meta.params.filter = filter.params;

  // Log the request
  exports.log({
    level: 'info',
    msg: 'Request for ' + options.endpoint,
    meta: {
      ip: options.request.ip,
      query: options.request.query
    }
  });

  // Performs a count request in order to get the total
  // amount of results.
  var countQuery = function() {
    exports.countQuery({
        db: options.db,
        table: options.table,
        where: filter.string,
      }, function(err, recordset) {
        if (!err) {
          // Add the results to the metadata.
          meta.totalCount = recordset[0][''];
          // Continue
          paginatedReq();
        } else {
          callback(err, index);
        }
      });
  };

  // Creates a paginated query string
  var query = function() {
    return exports.PaginatedQuery({
      table: options.table,
      orderBy: options.orderBy,
      orderDirection: options.orderDirection,
      fields: options.fields,
      filter: filter.string,
      meta: meta
    });
  };

  // Performs a paginated request
  var paginatedReq = function() {
    exports.indexRequest({
      db: options.db,
      query: query()
    }, function(err, recordset) {
      if (!err) {
        httpBody(recordset);
      } else {
        callback(err, index);
      }
    });
  };

  // Combines everything in one index object and return it
  var httpBody = function(data) {
    // Add metadata
    index._metadata = exports.ListMetadata.buildPager(meta, options.request, data);
    index._metadata.responseTime = new Date().getTime() - index._metadata.responseTime + ' ms';
    // Add the data to the index.
    index.response = data;
    var err = null;
    callback(err, index);
  };

  // Initialize sequence
  if (subFilter) {
    exports.subFilter(subFilter, function(error, list) {
      if (!error) {
        // Add the subfilter to the existing filter string. Create it from
        // scratch if there is no other filter.
        filter.string = filter.string ? filter.string + ' AND ' + list.string : 'WHERE ' + list.string;
        countQuery();
      } else {
        countQuery();
      }
    });
  } else {
    countQuery();
  }

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
  var connection = new sql.Connection(cred, function(err) {
    // Fetch the requested data
    var request = new sql.Request(connection);
    request.query(options.query).then(function(recordset) {
      var err = null;
      // Send to the client
      callback(err, recordset);
    }).catch(function(err) {
      // Log the error
      exports.log({
        level: 'error',
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
  var connection = new sql.Connection(cred, function(err) {
    // Perform a total row count in order to create a paginated result.
    var countRequest = new sql.Request(connection);
    countRequest.query(query).then(function(recordset) {
      callback(err, recordset);
    }).catch(function(err) {
      // Log the error
      exports.log({
        level: 'error',
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
 * @param  {string[]} [options.fields] - A list of the fields to expose. Defaults to all.
 * The baseProperty will always be included.
 * @param  {boolean}  [options.multiple=false]  - If the request returns multiple
 * entities, such as multiple line items for one order, this settings should be
 * set to true.
 * @param  {string}   [options.secondaryProperty] - A secondary property to
 * filter on when fetching the entity. Will be used as 'AND' in the query.
 * @param  {string/number}   options.id - The entity ID (KundNr or Ordernr etc.)
 * @param  {string/number}   options.secondaryValue - The value of the secondary
 * property.
 * @param  {object}   [options.request] - An Express req object.
 * @param  {array}    [options.attach] - An array of objects that follow the
 * attach() objects requirements. Can be used to attach additional info to the
 * entity before it is returned in the callback.
 * @param  {entityQueryCallback} callback
 */
exports.entityQuery = function(options, callback) {

  var response = {};
  var meta = {};
  response._metadata = exports.SingleMetadata();

  if (options.request) {
    meta = {
      ip: options.request.ip ? options.request.ip : '',
      query: options.request.query ? options.request.query : ''
    };
  }

  // Log the request
  exports.log({
    level: 'info',
    msg: 'Request for single ' + options.entity,
    meta: meta ? meta : ''
  });

  options.multiple = (options.multiple === true) ? true : false;

  var cred = exports.credentials(options.db);
  var id = exports.purger(options.baseProperty, options.id);

  // Manage which fields to fetch on the main entity
  options.fields = options.fields ? options.fields : [];
  options.fields.push(options.baseProperty);
  var fields = options.fields.length > 1 ? options.fields.join() : '*';

  var query = 'SELECT ' + fields + ' FROM ' + options.table + ' WHERE ' + options.baseProperty + '=' + id;

  // Add secondary query param
  query = (options.secondaryProperty && options.secondaryValue) ? query + ' AND ' + options.secondaryProperty + '=' + options.secondaryValue : query;

  // Connect to the database
  var connection = new sql.Connection(cred, function(err) {
    var request = new sql.Request(connection);
    request.query(query).then(function(recordset) {
      // Fetch additonal data if requested.
      if (options.attach && recordset.length > 0) {
        exports.attach(recordset[0], options.attach, function(entity){
          response.response = entity;
          response._metadata.responseTime = new Date().getTime() - response._metadata.responseTime + ' ms';
          callback(err, response);
        });
      }
      // Return multiple entities as array
      else if (recordset.length > 1 || options.multiple) {
        response._metadata.responseTime = new Date().getTime() - response._metadata.responseTime + ' ms';
        response.response = recordset;
        callback(err, response);
      }
      // Single entity
      else if (recordset.length === 1) {
        response._metadata.responseTime = new Date().getTime() - response._metadata.responseTime + ' ms';
        response.response = recordset[0];
        callback(err, response);
      }
      // No results
      else {
        callback(err);
      }

    }).catch(function(err) {
      // Log the error
      exports.log({
        level: 'error',
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
 * @param  {boolean}        [objects[*].multiple] - If true, returns data as
 * an array. Otherwise as an object. Useful if you know that it will only return
 * a single entity and want to avoid useless arrays. Defaults to true.
 * @param  {attachCallback} callback
 */
exports.attach = function(entity, objects, callback) {

  var countdown = objects.length;

  var request = function(options, cb) {
    var cred = exports.credentials(options.database);

    // Connect to the database
    var connection = new sql.Connection(cred, function(err) {

      var attachRequest = new sql.Request(connection);
      attachRequest.query(options.query).then(function(recordset) {
        cb(recordset, options);
      }).catch(function(err) {
        // Failure
        exports.log({
          level: 'error',
          msg: 'Error when attaching: ' + err,
          meta: {
            error: err,
            query: options.query
          }
        });
      });

    });
  };

  // Loop through all of the requested extra data and query the database,
  // then add the content to the entity and return it via callback.
  for (var i = 0; i < objects.length; i++) {
    // Default to TRUE for multiple
    objects[i].multiple = objects[i].multiple === undefined ? true : objects[i].multiple;
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
      database: objects[i].db,
      multiple: objects[i].multiple
    }, function(data, options) {
      // Attach as array if multiple is true, otherwise as an object.
      if (options.multiple) {
        entity[options.attachTo] = data;
      } else {
        entity[options.attachTo] = data[0];
      }
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
 *
 * @param  {object}   options
 * @param  {string}   options.entity - The name of the entity type i.e.
 * "Order" or "Customer" etc.
 * @param  {string}   options.db - The database to query.
 * @param  {string}   options.table - The table to query.
 * @param  {string}   options.baseProperty - The DB column to match the id to.
 * @param  {string}   [options.secondaryProperty] - A secondary column to match
 * with. Can be useful if there is no single unique value to use.
 * @param  {string/number}   options.id - The entity id.
 * @param  {string/number}   [options.secondaryValue] - The value of the secondary
 * property used to identify the entity we're updating.
 * @param  {object}   [parent] - Required to use if the entity that is being updated
 * has a parent, such as when updating a line item that belongs to an order.
 * @param  {string}   parent.table - The table that the parent is in.
 * @param  {string}   parent.baseProperty - The column to match the ID to.
 * @param  {string}   parent.id - The parent's entity ID.
 * @param  {object}   options.data - An object containing the new data to save.
 * @param  {updateEntityCallback} callback
 */
exports.updateEntity = function(options, callback) {

  var response = {};
  var amount = Object.keys(options.data).length;

  // Purge the ID
  options.id = exports.purger(options.baseProperty, options.id);

  // Bail if there are no updates to be made.
  if (!amount) {
    response.message = 'You haven\'t supplied any data';
    response.status = 400;
    return callback(response);
  }

  var properties = function() {
    array = [];
    for (var key in options.data) {
      array.push(key);
    }
    return array;
  };

  var compareExisting = function(entity, cb) {
    var equal = true;
    var err = 'The properties are identical to the existing entity data. No update has been performed.';
    for (var key in options.data) {
      // Check if the values are dates, since they might not be identically
      // formatted if they are. If so, convert them before comparing values.
      if (!isNaN(Date.parse(entity[key]))) {
        if (Date.parse(options.data[key]) !== Date.parse(entity[key])) {
          equal = false;
          return cb(null);
        }
      }
      // Treat all other types of values the same, i.e as strings.
      else {
        if (options.data[key] !== entity[key]) {
          equal = false;
          return cb(null);
        }
      }
    }
    return cb(err);
  };

  // Retrieve the existing entity in order to compare the existing data with the
  // new data. If there are no changes to be made, we'll abort the procedure.
  exports.entityQuery({
    entity: options.entity,
    db: options.db,
    table: options.table,
    baseProperty: options.baseProperty,
    id: options.id,
    secondaryProperty: options.secondaryProperty,
    secondaryValue: options.secondaryValue,
    fields: properties()
  }, function(err, entity){
    if (!err && entity) {
      compareExisting(entity.response, function(error) {
        // Bail
        if (error) {
          response.status = 202;
          response.message = error;
          exports.log({
            level: 'info',
            msg: response.message
          });
          callback(response);
        }
        // Continue
        else {
          buildQuery(entity);
        }
      });
    }
    else {
      callback(err, null);
    }
  });


  // Builds a SET query string based on the data
  var buildQuery = function() {

    var set = 'SET ';
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

    var query = 'UPDATE ' + options.table + ' ' +
                set + ' ' +
                ", Ändrad = Ändrad + 1 " + // Update the Ändrad value in order to prevent clashes with other updates.
                'WHERE ' + options.baseProperty + ' = ' + options.id;

    // Add secondary query param if needed
    query = (options.secondaryProperty && options.secondaryValue) ? query + ' AND ' + options.secondaryProperty + '=' + options.secondaryValue : query;

    // If we're updating a sub-entity such as a line item, we need to update the
    // 'Ändrad' value of its parent as well to prevent the changes from being
    // overridden by other clients. If an entity is being edited in Avance while
    // Kalabalik is editing the same entity, this keeps the last edit from being
    // permitted as it would have erased the initial change.
    if (options.parent) {
      var parentQuery = 'UPDATE ' + options.parent.table + ' ' +
                        'SET Ändrad = Ändrad + 1 ' +
                        'WHERE ' + options.parent.baseProperty + ' = ' + options.parent.id;
      query = exports.transaction(query, parentQuery);
    }

    update(query);
  };

  var update = function(query) {
    var cred = exports.credentials(options.db);
    // Perform the update
    var connection = new sql.Connection(cred, function(err) {
      var request = new sql.Request(connection);
      request.query(query).then(function(recordset) {
        // Success
        response.status = 200;
        response.message = 'Successfully updated ' + options.entity + ' ' + options.id;
        response.response = recordset;
        exports.log({
          level: 'info',
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
          level: 'error',
          msg: response.message,
          meta: {
            query: query
          }
        });
        callback(response);
      });
    });

  };

};

/**
 * Validates various entity IDs. Some system IDs in FDT are integers while some
 * are strings. This function helps keep track of which are which and silently
 * converts them to their proper type.
 * @param  {string}     property - The column name.
 * @param  {string/int} value - The value to be purged.
 * @return {string/int} The value as string or integer
 */
exports.purger = function(property, value) {
  switch(property) {
    case 'KundNr':
    case 'Kundnr':
    case 'ArtikelNr':
    case 'Artikelnr':
    case 'LevNr':
    case 'Levnr':
      return '\'' + value + '\'';
    default:
      return value;
  }
};

/**
 * Helper for a common need: To get the database credentials from the config
 * file by using the name of the database.
 */
exports.credentials = function(dbName) {
  // Copy the db credentials object
  var options = JSON.parse(JSON.stringify(config.mssql));
  // Add the database name
  options.database = options.databases[dbName];
  return options;
};

/**
 * Helper that wraps two SQL queries into a single transaction.
 * This is useful when you want to perform two different
 * updates in a single database request.
 *
 * @param  {string} queryOne - The first query string
 * @param  {string} queryTwo - The second query string
 * @return {string} The complete transaction string.
 */
exports.transaction = function(queryOne, queryTwo) {
  var transaction = 'BEGIN TRANSACTION ' +
                    queryOne + ' ' +
                    queryTwo + ' ' +
                    'COMMIT';
  return transaction;
};

/**
 * Callback for authenticate.
 *
 * @callback authenticateCallback
 * @param {string} err - A possible error.
 * @param {object} user - The user object.
 */

/**
 * Helper for Passport Basic authentication. Retrieves
 * a user object from the database based on the username
 * provided.
 * @param  {string}   username
 * @param  {authenticateCallback} callback
 */
exports.authenticate = function(username, callback) {
  var query = 'SELECT * FROM Använd WHERE Användare = \'' + username + '\'';
  var cred = exports.credentials('license');

  // Connect to the database to get the user
  var connection = new sql.Connection(cred, function(err) {
    var userRequest = new sql.Request(connection);
    userRequest.query(query).then(function(recordset) {
      var user = recordset[0];
      callback(null, user);
    }).catch(function(err) {
      // Log the error
      exports.log({
        level: 'error',
        msg: 'Error when authenticating: ' + err,
        meta: {
          error: err,
          query: query
        }
      });
      return callback(err, null);
    });
  });

};
