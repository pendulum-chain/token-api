const {ApiPromise, WsProvider} = require("@polkadot/api");
const Memcached = require('memcached');

const websocketUrls = {
    Amplitude: "wss://pencol-kus-01.pendulumchain.tech", Pendulum: "wss://rpc-pendulum.prd.pendulumchain.tech",
};

const elasticacheURL = 'stats-cluster.v37yj7.0001.use1.cache.amazonaws.com:11211';

const tokenNames = {
    Amplitude: "AMPE", Pendulum: "PEN",
};

async function fetchNetworks(network) {
    const websocketUrl = websocketUrls[network];
    const tokenName = tokenNames[network];

    const memcached = new Memcached(elasticacheURL);

    console.log(`Determine issuance on ${network} ...`);

    const wsProvider = new WsProvider(websocketUrl);
    const api = await ApiPromise.create({provider: wsProvider, noInitWarn: true});

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

    return {
        totalIssuance: format(totalIssuance),
        totalTransferable: format(totalTransferable),
        totalLocked: format(totalLocked),
        totalReserved: format(totalReserved),
    };
}

exports.handler = async (event, context) => {
    const network = event.queryStringParameters.network;
    if (network !== "Amplitude" && network !== "Pendulum") {
        return {
            status: '400', statusDescription: 'Bad Request', headers: {
                vary: [{
                    key: 'Vary', value: '*',
                }], 'last-modified': [{
                    key: 'Last-Modified', value: '2017-01-13',
                }],
            }, body: `Invalid network: ${network}`,
        };
    }

    const stats = await fetchNetworks(network);

    return {
        status: '200', statusDescription: 'OK', headers: {
            vary: [{
                key: 'Vary', value: '*',
            }], 'last-modified': [{
                key: 'Last-Modified', value: '2017-01-13',
            }],
        }, body: stats,
    };
};


