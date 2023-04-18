# Token API

This repository contains the code for the Token API.

The code is based on [this](https://github.com/danielfsousa/express-rest-boilerplate/tree/main) boilerplate
template.

# API

## Routes

For now, the API only supports the following endpoints:

- `<endpoint>/v1/status`
- `<endpoint>/v1/:network/token/stats`

The `:network` parameter can be either `pendulum` or `amplitude`.

## Cache

The API uses a cache server to store the token stats.
The cache server is a memcached instance.
The server address is defined in the `CACHE_URI` environment variable and the lifetime of cache entries is defined in
the `CACHE_LIFETIME_SECONDS` environment variable.
Each network has a different cache key, thus the stats for each network are stored separately.

# Getting started

#### Install dependencies:

```bash
yarn
```

#### Set environment variables:

```bash
cp .env.example .env
```

## Running Locally

```bash
yarn dev
```

## Running in Production

```bash
yarn start
```

## Lint

```bash
# lint code with ESLint
yarn lint

# try to fix ESLint errors
yarn lint:fix

# lint and watch for changes
yarn lint:watch
```

## Logs

```bash
# show logs in production
pm2 logs
```

## Documentation

```bash
# generate and open api documentation
yarn docs
```

## Available environment variables

- `NODE_ENV` - The environment the application is running in, default is "production"
- `PORT` - The port the HTTP server will listen on, default is 3000
- `AMPLITUDE_WSS` - The Amplitude Websocket URL, default is "wss://rpc-amplitude.pendulumchain.tech"
- `PENDULUM_WSS` - The Pendulum Websocket URL, default is "wss://rpc-pendulum.prd.pendulumchain.tech"
- `CACHE_URI` - The URI of the cache server instance, default is `http://localhost:11211`
- `CACHE_LIFETIME_SECONDS` - The lifetime of a cache entry in seconds, default is 600 seconds
- `RATE_LIMIT_MAX_REQUESTS` - The maximum number of requests per IP address, default is 100
- `RATE_LIMIT_WINDOW_MINUTES` - The time window in minutes for the rate limit, default is 15 minutes
- `RATE_LIMIT_NUMBER_OF_PROXIES` - The number of proxies between server and user, default is 1
