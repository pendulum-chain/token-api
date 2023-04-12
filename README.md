# Token API

This repository contains the code for the Token API.
The Token API is deployed as a Lambda function on AWS.

## Testing locally

To run the function locally, you can use `npm run start`.

## Deploying as a Lambda function on AWS

To deploy the Token API as a Lambda function on AWS, we need to include the npm dependencies in the zip file.
To do this, just `npm install` the dependencies and then create a zip file of the entire directory.
You can use `npm run build` to do this.
