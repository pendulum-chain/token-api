const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/token.controller');
const {
  getStats,
} = require('../../validations/token.validation');

const router = express.Router();

router
  .route('/')
  /**
   * @api {get} token/stats List token stats
   * @apiDescription Get the current token stats
   * @apiVersion 1.0.0
   * @apiName ListTokenStats
   *
   * @apiSuccess {Object[]} tokenStats List of token stats.
   */
  .get(validate(getStats), controller.list);

module.exports = router;
