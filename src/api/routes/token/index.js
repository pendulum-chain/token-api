const express = require('express');
const statsRoutes = require('./stats.route');

const router = express.Router();

/**
 * GET token/status
 */
router.get('/status', (req, res) => res.send('OK'));

/**
 * GET token/docs
 */
router.use('/docs', express.static('docs'));

router.use('/stats', statsRoutes);

module.exports = router;
