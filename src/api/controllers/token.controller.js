/**
 * Get token stats
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const stats = {
      total: 0,
    };
    res.json(stats);
  } catch (error) {
    next(error);
  }
};
