const path = require('path');

// import .env variables
require('dotenv-safe').config({
  path: path.join(__dirname, '../../.env'),
});

module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  amplitudeWss: process.env.AMLIPUTE_WSS,
  pendulumWss: process.env.PENDULUM_WSS,
  cacheEndpoint: process.env.CACHE_URI,
  cacheLifetime: process.env.CACHE_LIFETIME_SECONDS,
  logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
};
