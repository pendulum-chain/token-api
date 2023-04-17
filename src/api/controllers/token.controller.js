const memcached = require('../../config/memcached');

const statsCacheKey = 'token-stats';

/**
 * Get token stats
 * @public
 */
exports.get = async (req, res, next) => {
  try {
    let stats;

    if (memcached.isConnected()) {
      stats = await memcached.get(statsCacheKey);
    } else {
      stats = {
        totalSupply: 0,
      };
    }

    res.json(stats);
  } catch (error) {
    next(error);
  }
};
