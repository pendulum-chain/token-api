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

const endpoint = cacheEndpoint || 'http://localhost:11211';
const cache = new Memcached(endpoint, defaultOptions);

/**
 * Connect to memcached server
 *
 * @returns {object} Memcached connection
 * @public
 */
exports.connect = () => new Promise((resolve, reject) => {
  console.log(`Connecting to Memcache at ${endpoint}...`);

  cache.connect(endpoint, (err) => {
    if (err) {
      reject(err);
    } else {
      console.log(`Connected to Memcache at ${endpoint}`);
      resolve(cache);
    }
  });
});

exports.isConnected = () => cache.connections.length > 0;

exports.get = (key) => new Promise((resolve, reject) => {
  cache.get(key, (err, data) => {
    if (err) {
      reject(err);
    } else {
      resolve(data);
    }
  });
});

exports.set = (key, value) => new Promise((resolve, reject) => {
  // Use 10 minutes as default
  const lifetime = cacheLifetime || 600;

  cache.set(key, value, lifetime, (err) => {
    if (err) {
      reject(err);
    } else {
      resolve();
    }
  });
});
