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
var cors = false;

/**
 * Debug mode
 * Set to true to increase verbosity of the logging.
 */
var debug = false;

exports.port = 3000; // Select the port to run Kalabalik on.
exports.mssql = mssql;
exports.credentials = credentials;
exports.winstonTransport = winstonTransport;
exports.cors = cors;
exports.debug = debug;
