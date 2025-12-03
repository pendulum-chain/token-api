const memcached = require("../../config/memcached");
const { executeApiCall } = require("../services/rpc.service");
const {
  ACCOUNTS_TO_SUBTRACT_AMPLITUDE,
  ACCOUNTS_TO_SUBTRACT_PENDULUM_OLD,
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
    const decimals = 12;
    const precision = 3;
    const divisor = BigInt(10) ** BigInt(decimals);
    const precisionDivisor = BigInt(10) ** BigInt(decimals - precision);

    const integerPart = n / divisor;
    const fractionalPart = (n % divisor) / precisionDivisor;

    formattedNumber = `${integerPart}.${fractionalPart
      .toString()
      .padStart(precision, "0")}`;

    // Remove trailing zeros and dot if necessary
    formattedNumber = formattedNumber.replace(/\.?0+$/, "");
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

  // We mantain the supplyToIgnore to subtract it from the total transferable
  let accountsToSubtract = [];
  console.log("network", network)
  if (network === "amplitude") {
    accountsToSubtract = ACCOUNTS_TO_SUBTRACT_AMPLITUDE;
  } else if (network === "pendulum") {
    accountsToSubtract = ACCOUNTS_TO_SUBTRACT_PENDULUM_OLD;
  } else {
    console.error("Invalid network");
  }

  // Ensure TREASURY_ACCOUNT is always excluded
  if (TREASURY_ACCOUNT) {
    console.log("accountsToSubtract", accountsToSubtract);
    accountsToSubtract.push(TREASURY_ACCOUNT);
  }

  accounts.forEach((entry) => {
    const account = entry[0].toHuman()[0];
    const balances = entry[1].toHuman().data;
    const frozen = BigInt(balances.frozen.replace(/,/g, ""));
    const free = BigInt(balances.free.replace(/,/g, ""));
    const reserved = BigInt(balances.reserved.replace(/,/g, ""));

    // We define the circulating supply as the total issuance minus
    // the total balance (free + reserved) of a set of predefined accounts
    // We use a Set to ensure we don't double count if TREASURY_ACCOUNT is also in the list
    const uniqueAccountsToSubtract = new Set(
      accountsToSubtract.map((a) => getAddressForFormat(a, 0))
    );

    if (uniqueAccountsToSubtract.has(getAddressForFormat(account, 0))) {
      const totalBalance = free + reserved;
      console.log(
        `Adding account ${account} with total balance ${format(
          totalBalance
        )} to supplyToIgnore`
      );
      supplyToIgnore += totalBalance;
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
    totalCirculating: format(totalIssuance - supplyToIgnore),
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
