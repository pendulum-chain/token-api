const express = require("express");
const httpStatus = require("http-status");
const statsRoutes = require("./stats.route");

const router = express.Router({ mergeParams: true });

/**
 * GET v1/status
 */
router.get("/status", (req, res) => res.send(httpStatus.OK));

/**
 * GET v1/docs
 */
// Don't show docs for now.
// router.use("/docs", express.static("docs"));

/**
 * GET v1/:network/token/stats
 */
router.use("/:network/token/stats", statsRoutes);

module.exports = router;
