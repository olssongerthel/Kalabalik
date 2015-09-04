var pagination = require('pagination');

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

  if (!req.query.page) {
    req.query.page = 1;
    req.url = req.query.filter ? req.url + '&page=1' : req.url + '?page=1';
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
    self: pageData.current ? req.url.replace(/\page=[0-9]+/, 'page=' + pageData.current) : false,
    first: pageData.first ? req.url.replace(/\page=[0-9]+/, 'page=' + pageData.first) : req.url.replace(/\page=[0-9]+/, 'page=' + 1),
    previous: pageData.previous ? req.url.replace(/\page=[0-9]+/, 'page=' + pageData.previous) : false,
    next: pageData.next ? req.url.replace(/\page=[0-9]+/, 'page=' + pageData.next) : false,
    last: pageData.pageCount ? req.url.replace(/\page=[0-9]+/, 'page=' + pageData.pageCount) : false,
  };

  return metadata;
};

exports.SingleMetadata = function(req) {
  var metadata = {};
  metadata.responseTime = new Date().getTime();
  return metadata;
};
