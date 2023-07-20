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

  router
  .route("/totalIssuance")
  /**
   * @api {get} token/stats/totalIssuance List token stats totalIssuance
   * @apiDescription Get the current token stats totalIssuance
   * @apiVersion 1.0.0
   * @apiName ListTokenStatsTotalIssuance
   *
   * @apiSuccess {Object[]} tokenStats List of token stats totalIssuance.
   */
  .get(controller.getTotalIssuance);

module.exports = router;
