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

router
  .route("/totalTransferable")
  /**
   * @api {get} token/stats/totalTransferable List token stats totalTransferable
   * @apiDescription Get the current token stats totalTransferable
   * @apiVersion 1.0.0
   * @apiName ListTokenStatsTotalTransferable
   *
   * @apiSuccess {Object[]} tokenStats List of token stats totalTransferable.
   */
  .get(controller.getTotalTransferable);

router
  .route("/totalLocked")
  /**
   * @api {get} token/stats/totalLoked List token stats totalLocked
   * @apiDescription Get the current token stats totalLocked
   * @apiVersion 1.0.0
   * @apiName ListTokenStatsTotalLocked
   *
   * @apiSuccess {Object[]} tokenStats List of token stats totalLocked.
   */
  .get(controller.getTotalLocked);

router
  .route("/totalReserved")
  /**
   * @api {get} token/stats/totalReserved List token stats totalReserved
   * @apiDescription Get the current token stats totalReserved
   * @apiVersion 1.0.0
   * @apiName ListTokenStatsTotalReserved
   *
   * @apiSuccess {Object[]} tokenStats List of token stats totalReserved.
   */
  .get(controller.getTotalReserved);

module.exports = router;
