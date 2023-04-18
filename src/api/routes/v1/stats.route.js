const express = require("express");
const controller = require("../../controllers/token.controller");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  /**
   * @api {get} token/stats List token stats
   * @apiDescription Get the current token stats
   * @apiVersion 1.0.0
   * @apiName ListTokenStats
   *
   * @apiSuccess {Object[]} tokenStats List of token stats.
   */
  .get(controller.get);

module.exports = router;
