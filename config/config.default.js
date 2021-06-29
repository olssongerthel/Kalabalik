/**
 * MS SQL database credentials.
 */
var mssql = {
  user: '',
  password: '',
  server: '',
  port: 1433,
  options: {
    encrypt: false // Set to true if server is on Azure.
  },
  databases: {
    invoicing: '', // Usually Fakt000
    supplier: '', // Usually Lres000
    license: 'fdtlic'
  }
}

/**
 * Basic Authentication login credentials.
 *
 * If enabled, the username and password will be used as authentication
 * for the API. If not, the FDT user base will be used.
 */
var simpleAuth = {
  enabled: false,
  username: '',
  password: ''
}

/**
 * Optional Winston logging transport. Defaults to file logging if not
 * specified. You can add a logging transport by installing it as a module,
 * i.e.'npm install winston-slack' and add its options to this variable.
 * @type {Object}   winstonTransport
 * @type {Function} winstonTransport.module - The required module.
 * @type {Object}   winstonTransport.options - The options for the specific
 * transport. Will vary from module to module. See that transports's docs.
 */
var winstonTransport = {
  // module: require(''),
  // options: {}
}

/**
 * CORS settings
 * Set to true to allow cross-origin resource sharing.
 */
var cors = false

/**
 * IP Filter
 *
 * Add IP addresses to the array in order to enable. API requests will only
 * be allowed from the listed IP addresses. Use '::1' for localhost, i.e. the
 * client that is hosting Kalabalik.
 */
var ipfilter = []

/**
 * Debug mode
 * Set to true to increase verbosity of the logging.
 */
var debug = false

exports.port = 3000 // Select the port to run Kalabalik on.
exports.mssql = mssql
exports.simpleAuth = simpleAuth
exports.winstonTransport = winstonTransport
exports.cors = cors
exports.ipfilter = ipfilter
exports.debug = debug
