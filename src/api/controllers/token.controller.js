const { ApiPromise, WsProvider } = require("@polkadot/api");
const memcached = require("../../config/memcached");
const { amplitudeWss, pendulumWss } = require("../../config/vars");

async function fetchTokenStats(network) {
  console.log(`Fetching token stats for network ${network}`);

  const websocketUrl = network === "amplitude" ? amplitudeWss : pendulumWss;

  const wsProvider = new WsProvider(websocketUrl);
  console.log(`Connecting to node ${websocketUrl}...`);
  const api = await ApiPromise.create({
    provider: wsProvider,
    noInitWarn: true,
  });
  console.log(`Connected to node ${websocketUrl}`);

  const accounts = await api.query.system.account.entries();

  let totalIssuance = BigInt(0);
  let totalTransferable = BigInt(0);
  let totalLocked = BigInt(0);
  let totalReserved = BigInt(0);

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
    let formattedNumber = "0";
    try {
      // Downscale by 12 decimals
      const numberInUnits = n / BigInt(10) ** BigInt(12);
      formattedNumber = numberInUnits.toString();
    } catch (error) {
      console.error("Couldn't format number", n, error);
    }
    return formattedNumber;
  };

  return {
    totalIssuance: format(totalIssuance),
    totalTransferable: format(totalTransferable),
    totalLocked: format(totalLocked),
    totalReserved: format(totalReserved),
  };
}

/**
 * Handles the querying of token stats and calls the callback with the results.
 * @param request: {req, res, next}
 * @param callback: (stats) => undefined
 */
async function tryGetTokenStats(request, callback) {
  const { req, res, next } = request;

  const network = req.params.network
    ? req.params.network.toLowerCase()
    : undefined;

  if (network !== "amplitude" && network !== "pendulum") {
    res.status(400).json({
      message: "Invalid network",
    });
    return;
  }

  const baseCacheKey = "token-stats";
  const cacheKey = `${baseCacheKey}-${network}`;

  try {
    if (memcached.isConnected()) {
      try {
        const stats = await memcached.get(cacheKey);
        callback(stats);
        return;
      } catch (error) {
        console.log("Error getting token stats from memcached", error);
        // falling back to normal query
      }
    }

    // If memcached is not connected or query failed, do normal query
    const stats = await fetchTokenStats(network);

    // Cache results if possible
    if (memcached.isConnected()) {
      try {
        console.log("Saving token stats to memcached...");
        await memcached.set(cacheKey, stats);
      } catch (error) {
        console.log("Error saving token stats to memcached", error);
      }
    }

    callback(stats);
  } catch (error) {
    next(error);
  }
}

/**
 * Get all token stats
 * @public
 */
exports.get = async (req, res, next) => {
  tryGetTokenStats({ req, res, next }, (stats) => {
    res.json(stats);
  });
};

/**
 * Get token totalIssuance
 * @public
 */
exports.getTotalIssuance = async (req, res, next) => {
  tryGetTokenStats({ req, res, next }, (stats) => {
    res.json(stats.totalIssuance);
  });
};
