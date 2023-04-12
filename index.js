const {ApiPromise, WsProvider} = require("@polkadot/api");
const Memcached = require('memcached');

const websocketUrls = {
    // Capitalization is important!
    amplitude: process.env.AMPLITUDE_WSS || "wss://pencol-kus-02.pendulumchain.tech",
    pendulum: process.env.PENDULUM_WSS || "wss://rpc-pendulum.prd.pendulumchain.tech",
};

const cacheUrl = process.env.CACHE_URL || undefined;
const cachePort = process.env.CACHE_PORT || 11211;

const tokenNames = {
    amplitude: "AMPE", pendulum: "PEN",
};

// Set lifetime to 10 minutes
const lifetime = process.env.LIFETIME_SECONDS || 10 * 60;

// Returns the token stats and a timestamp `{data: {totalIssuance, totalTransferable, totalLocked, totalReserved}, timestamp}`
async function fetchNetworks(network) {
    const websocketUrl = websocketUrls[network];
    const tokenName = tokenNames[network];

    console.log(`Determine issuance on ${network} ...`);

    const cacheEndpoint = `${cacheUrl}:${cachePort}`;
    const memcached = cacheUrl && new Memcached(cacheEndpoint, {
        timeout: 5000,
        retries: 0,
        failures: 1,
        remove: true,
        idle: 0,
        reconnect: 0,
        retry: 0,
    });

    // We switch to a different cache key for each network
    const cacheKey = `token-stats-${network}`;

    if (memcached) {
        try {
            const cachedData = await new Promise((resolve, reject) => {
                console.log("Checking cache for key", cacheKey);
                memcached.get(cacheKey, (err, data) => {
                    if (err) {
                        reject(err);
                    }

                    if (data) {
                        resolve(data);
                    }
                });
            })

            if (cachedData) {
                console.log("Returning cached data");
                memcached.end();
                return cachedData;
            }
        } catch (error) {
            console.log("Error while fetching from cache", error);
        }
    }


    const wsProvider = new WsProvider(websocketUrl);
    console.log(`Connecting to node ${websocketUrl}...`);
    const api = await ApiPromise.create({provider: wsProvider, noInitWarn: true});
    console.log(`Connected to node ${websocketUrl}`);

    const accounts = await api.query.system.account.entries();

    let totalIssuance = 0n;
    let totalTransferable = 0n;
    let totalLocked = 0n;
    let totalReserved = 0n;

    accounts.forEach((entry) => {
        const balances = entry[1].toHuman().data;
        const miscFrozen = BigInt(balances.miscFrozen.replace(/,/g, ""));
        const feeFrozen = BigInt(balances.feeFrozen.replace(/,/g, ""));
        const frozen = miscFrozen > feeFrozen ? miscFrozen : feeFrozen;
        const free = BigInt(balances.free.replace(/,/g, ""));
        const reserved = BigInt(balances.reserved.replace(/,/g, ""));

        totalIssuance += free + reserved;
        totalTransferable += free - frozen;
        totalLocked += frozen;
        totalReserved += reserved;
    });

    const format = (n) => {
        let letters = n.toString(10).padStart(13, "0").slice(0, -9);
        let str = `${letters.slice(-6, -3)}.${letters.slice(-3)}`;
        letters = letters.slice(0, -6);
        while (letters.length) {
            str = `${letters.slice(-3)},${str}`;
            letters = letters.slice(0, -3);
        }
        return str;
    };

    console.log(`\nTotal issuance: ${format(totalIssuance)} ${tokenName}`);
    console.log(`Total transferable (in circulation): ${format(totalTransferable)} ${tokenName}`);
    console.log(`Total locked: ${format(totalLocked)} ${tokenName}`);
    console.log(`Total reserved: ${format(totalReserved)} ${tokenName}`);

    const data = {
        totalIssuance: format(totalIssuance),
        totalTransferable: format(totalTransferable),
        totalLocked: format(totalLocked),
        totalReserved: format(totalReserved),
    };

    const timestampedData = {
        data,
        timestamp: new Date().getTime(),
    }

    if (memcached) {
        console.log("Setting cache for key", cacheKey);
        try {
            await new Promise((resolve, reject) => {
                    memcached.set(cacheKey, timestampedData, lifetime, (err) => {
                        if (err) {
                            reject(err)
                        } else {
                            resolve();
                        }
                    });
                }
            );
        } catch (error) {
            console.log("Error while setting cache", error);
        }

        memcached.end();
    }

    api.disconnect();

    return timestampedData;
}

const handler = async (event, context) => {
    const path = event.requestContext.http.path;

    // Assume the path to be /{network}/token/stats
    const splittedPath = path.split('/');
    if (splittedPath.length < 3 && splittedPath[2] !== "token" && splittedPath[3] !== "stats") {
        return {
            status: '400', statusDescription: 'Bad Request', headers: {
                vary: [{
                    key: 'Vary', value: '*',
                }],
            }, body: `Invalid path: ${event.path}`,
        };
    }

    const network = splittedPath[1];

    if (!network && network.toLowerCase() !== "amplitude" && network.toLowerCase() !== "pendulum") {
        return {
            status: '400', statusDescription: 'Bad Request', headers: {
                vary: [{
                    key: 'Vary', value: '*',
                }],
            }, body: `Invalid network: ${network}`,
        };
    }

    const timestampedData = await fetchNetworks(network);
    const lastModified = new Date(timestampedData.timestamp).toUTCString();

    return {
        status: '200', statusDescription: 'OK', headers: {
            vary: [{
                key: 'Vary', value: '*',
            }], 'last-modified': [{
                key: 'Last-Modified', value: lastModified,
            }],
        }, body: timestampedData.data,
    };
};


async function main() {
    const event = {
        requestContext: {
            http: {
                path: "/amplitude/token/stats"
            }
        }
    };
    const context = {};
    const result = await handler(event, context);
    console.log(result);
}

if (process.env.NODE_ENV === "development") {
    main();
}

exports.handler = handler;