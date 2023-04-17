const Joi = require('joi');

module.exports = {
  // GET /token/stats
  getStats: {
    query: {
      page: Joi.number().min(1),
      perPage: Joi.number().min(1).max(100),
      name: Joi.string(),
      email: Joi.string(),
    },
  },

};
