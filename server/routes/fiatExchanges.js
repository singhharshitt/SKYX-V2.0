const express = require('express');
const router = express.Router();
const fiatExchangeService = require('../services/fiatExchangeRecommendationService');

/**
 * GET /api/fiat-exchanges/recommendations
 * Returns top 3 recommended fiat exchange providers
 * Query params: base (default: USD), target (default: EUR)
 */
router.get('/recommendations', async (req, res) => {
    try {
        const base = (req.query.base || 'USD').toUpperCase();
        const target = (req.query.target || 'EUR').toUpperCase();

        const recommendations = await fiatExchangeService.getFiatExchangeRecommendations(base, target);

        res.json({
            success: true,
            ...recommendations
        });
    } catch (error) {
        console.error('[FiatExchangeRoute] Error:', error.message);

        // Never throw 500 - return graceful fallback
        res.json({
            success: false,
            updatedAt: new Date().toISOString(),
            base: req.query.base || 'USD',
            target: req.query.target || 'EUR',
            providers: [],
            error: 'Unable to fetch recommendations at this time'
        });
    }
});

module.exports = router;
