const Memcached = require('memcached');
const { cacheEndpoint, cacheLifetime } = require('./vars');

// // set mongoose Promise to Bluebird
// Memcached.Promise = Promise;

const defaultOptions = {
  timeout: 5000,
  retries: 0,
  failures: 1,
  remove: true,
  idle: 0,
  reconnect: 0,
  retry: 0,
  lifetime: cacheLifetime,
};

/**
 * Connect to memcached server
 *
 * @returns {object} Memcached connection
 * @public
 */
exports.connect = () => {
  const endpoint = cacheEndpoint || 'http://localhost:11211';

  console.log(`Connecting to Memcache at ${endpoint}...`);
  const cache = new Memcached(endpoint, defaultOptions);
  console.log(`Connected to Memcache at ${endpoint}`);
  return cache;
};
