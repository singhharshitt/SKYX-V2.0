const express = require('express');
const router = express.Router();
const exchangeService = require('../services/exchangeRecommendationService');

/**
 * GET /api/exchanges/recommendations
 * Returns top 3 recommended exchanges with real-time data
 */
router.get('/recommendations', async (req, res) => {
    try {
        const recommendations = await exchangeService.getExchangeRecommendations();

        res.json({
            success: true,
            ...recommendations
        });
    } catch (error) {
        console.error('[ExchangeRoute] Error:', error.message);

        // Never throw 500 - return graceful fallback
        res.json({
            success: false,
            updatedAt: new Date().toISOString(),
            exchanges: [],
            error: 'Unable to fetch recommendations at this time'
        });
    }
});

module.exports = router;
