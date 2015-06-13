exports.filter = function(params) {

  function isEmpty(obj) {
    return Object.keys(obj).length === 0;
  }

  // Bail if there are no queries
  if (isEmpty(params)) {
    return;
  }

  var filter = '';
  var amount = Object.keys(params).length;
  var index = 0;

  // Remove the top query from the amount since it's not a filter.
  if (params.top) {
    amount = amount - 1;
  }

  // Build a valid SQL query from the parameters
  for (var key in params) {
    // Don't act on the top value since it's not a filter.
    if (key == 'top') {
      continue;
    }
    if (index === 0) {
      filter = 'WHERE ';
    }
    index++;
    filter = filter + key + "=" + params[key];
    if (amount > 1 && index < amount) {
      filter = filter + ' and ';
    }
  }

  return filter;

};
