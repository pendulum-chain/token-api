# Token API

This repository contains the code for the Token API.
The Token API is deployed as a Lambda function on AWS.

## Testing locally

To run the function locally, you can use `npm run start`.

## Deploying as a Lambda function on AWS

To deploy the Token API as a Lambda function on AWS, we need to include the npm dependencies in the zip file.
To do this, just `npm install` the dependencies and then create a zip file of the entire directory.
You can use `npm run build` to do this.

## Available environment variables

- `AMPLITUDE_WSS` - Amplitude Websocket URL
- `PENDULUM_WSS` - Pendulum Websocket URL
- `CACHE_URL` - The URL of the cache
- `CACHE_PORT` - The port of the cache
- `LIFETIME_SECONDS` - The lifetime of a cache entry in seconds, default is 10 minutes
