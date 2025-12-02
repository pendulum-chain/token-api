const memcached = require("../../config/memcached");
const { executeApiCall } = require("../services/rpc.service");
const {
  ACCOUNTS_TO_SUBTRACT_AMPLITUDE,
  ACCOUNTS_TO_SUBTRACT_PENDULUM,
  TREASURY_ACCOUNT,
} = require("../utils/constants");
const { Keyring } = require("@polkadot/api");

function getAddressForFormat(address, ss58Format) {
  if (typeof ss58Format === "string") {
    ss58Format = parseInt(ss58Format, 10);
  }

  try {
    const keyring = new Keyring();
    const encodedAddress = keyring.encodeAddress(address, ss58Format);
    return encodedAddress;
  } catch (error) {
    // Assumed to be EVM address.
    console.error(`Error encoding address ${address}: ${error}`);
    return address;
  }
}

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

async function fetchTokenStats(network) {
  console.log(`Fetching token stats for network ${network}`);

  const accounts = await executeApiCall(network, (api) =>
    api.query.system.account.entries()
  );

  let totalIssuance = BigInt(0);
  let totalTransferable = BigInt(0);
  let totalLocked = BigInt(0);
  let totalReserved = BigInt(0);
  let supplyToIgnore = BigInt(0);

  accounts.forEach((entry) => {
    const account = entry[0].toHuman()[0];
    const balances = entry[1].toHuman().data;
    const frozen = BigInt(balances.frozen.replace(/,/g, ""));
    const free = BigInt(balances.free.replace(/,/g, ""));
    const reserved = BigInt(balances.reserved.replace(/,/g, ""));

    // We mantain the supplyToIgnore to subtract it from the total transferable
    let accountsToSubtract = [];
    if (network === "amplitude") {
      accountsToSubtract = ACCOUNTS_TO_SUBTRACT_AMPLITUDE;
    } else if (network === "pendulum") {
      accountsToSubtract = ACCOUNTS_TO_SUBTRACT_PENDULUM;
    } else {
      console.error("Invalid network");
    }

    // We define the circulating supply as the total transferable (free - frozen) minus
    // the total transferable of a set of predefined multisig accounts (https://github.com/pendulum-chain/tasks/issues/242)
    // We keep track of the transferable of these accounts
    // which will then be subtracted from the total transferable
    for (const accountToSubtract of accountsToSubtract) {
      if (
        getAddressForFormat(accountToSubtract, 0) ===
        getAddressForFormat(account, 0)
      ) {
        if (
          getAddressForFormat(accountToSubtract, 0) ===
          getAddressForFormat(TREASURY_ACCOUNT, 0)
        ) {
          // Exclude treasury balance from transferable tokens
          totalTransferable -= free;
        } else {
          const transferable = free - frozen;
          console.log(`Adding account ${account} with transferable ${format(transferable)} to supplyToIgnore`);
          supplyToIgnore += transferable;
        }
      }
    }

    totalIssuance += free + reserved;
    totalTransferable += free - frozen;
    totalLocked += frozen;
    totalReserved += reserved;
  });

  console.log("Total supply to ignore:", format(supplyToIgnore));

  return {
    totalIssuance: format(totalIssuance),
    totalTransferable: format(totalTransferable),
    totalLocked: format(totalLocked),
    totalReserved: format(totalReserved),
    totalCirculating: format(totalTransferable - supplyToIgnore),
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

/**
 * Get token totalTransferable
 * @public
 */
exports.getTotalTransferable = async (req, res, next) => {
  tryGetTokenStats({ req, res, next }, (stats) => {
    res.json(stats.totalTransferable);
  });
};

/**
 * Get token totalLocked
 * @public
 */
exports.getTotalLocked = async (req, res, next) => {
  tryGetTokenStats({ req, res, next }, (stats) => {
    res.json(stats.totalLocked);
  });
};

/**
 * Get token totalReserved
 * @public
 */
exports.getTotalReserved = async (req, res, next) => {
  tryGetTokenStats({ req, res, next }, (stats) => {
    res.json(stats.totalReserved);
  });
};

/**
 * Get token cirulating supply
 * @public
 */
exports.getCirculatingSupply = async (req, res, next) => {
  tryGetTokenStats({ req, res, next }, (stats) => {
    res.json(stats.totalCirculating);
  });
};
