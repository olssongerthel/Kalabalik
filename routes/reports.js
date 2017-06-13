var helpers = require('../utils/helpers'),
    fs = require('fs'),
    sql = require('mssql');

/*
 * Prevents unwanted queries such as SET or DELETE
 * Returns FALSE if the string does not validate.
 */
function validateQuery(query) {
  query = query.toUpperCase();
  if (query.indexOf('DELETE') > 0 || query.indexOf('SET') > 0) {
    return false;
  } else {
    return true;
  }
}

/*
 * Converts the parameter value to its type in order
 * to comply with SQL syntax.
 */
function parameterPrepare(parameter) {
  var value = '';
  switch(parameter.type) {
    case 'integer':
      value = parseInt(parameter.value);
      break;
    default:
      value = '\'' + parameter.value + '\'';
  }
  return value;
}

/*
 * Adds query parameter variables to the query.
 */
function queryConstructor(query, parameters) {
  for (var property in parameters) {
    // Convert the value to its proper type
    var value = parameterPrepare(parameters[property]);
    // Replace the variables in the query with the param value
    var regex = new RegExp('@' + property, 'g');
    query = query.replace(regex, value);
  }
  return query;
}

/*
 * Finds all available reports and returns them in an array.
 */
exports.reports = function() {
  var files = fs.readdirSync('./reports');
  // Make sure we're just listing the directories.
  var reports = [];
  for (var i = 0; i < files.length; i++) {
    if (fs.statSync('./reports/' + files[i]).isDirectory()) {
      reports.push(files[i]);
    }
  }
  return reports;
};

/*
 * Generates the report output.
 */
exports.report = function(req, res) {

  var name = req.params.report;
  var report = require('../reports/' + name + '/' + name + '.report.js').report;

  // Loop through available query parameters and replace default
  // values with them.
  for (var queryParam in req.query) {
    if (typeof report.parameters[queryParam] !== 'undefined' && req.query[queryParam] !== '') {
      report.parameters[queryParam].value = req.query[queryParam];
    }
  }

  // Make sure that all required parameters have been set
  for (var param in report.parameters) {
    if (report.parameters[param].required && !report.parameters[param].value) {
      res.jsonp({
        status: 500,
        message: 'Missing required query parameter.',
        param: param
      });
    }
  }

  // Get the SQL query from the report
  fs.readFile('./reports/' + name + '/' + name + '.report.sql', 'utf8', function (err, queryString) {
    if (!err) {
      // Build the query
      queryString = queryConstructor(queryString, report.parameters);
      // Validate it
      if (!validateQuery(queryString)) {
        res.status(500).jsonp({
          status: 500,
          message: 'The query does not validate. DELETE or SET is not permitted.'
        });
        return;
      }
      // Perform the query and return the data to the client
      helpers.query({
        query: queryString,
        db: 'invoicing',
        multiple: report.list ? true : false
      }, function(err, data) {
        if (!err) {
          data._metadata.params = report.parameters;
          res.json(data);
        }
        else {
          res.jsonp(err);
        }

      });
    }
    else {
      res.jsonp(err);
    }
  });
};
