const express = require('express');
const router = express.Router();
const binanceService = require('../services/binanceService');
const { validateHistoryRequest } = require('../utils/validators');

// GET /api/rates/history
// Query: from (crypto symbol), to (quote currency, default USDT), days
router.get('/history', async (req, res, next) => {
    try {
        const { from, to = 'USDT', days = 7 } = req.query;
        const validation = validateHistoryRequest(from, to, days);

        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: validation.error });
        }

        try {
            const history = await binanceService.getHistoricalData(from, to, parseInt(days));

            res.json({
                success: true,
                data: {
                    from,
                    to,
                    days: parseInt(days),
                    prices: history
                },
                source: 'Binance'
            });
        } catch (historyError) {
            // Gracefully handle historical data failures - don't crash with 500
            console.warn(`[History] Failed to fetch data for ${from}/${to}:`, historyError.message);

            res.json({
                success: false,
                message: 'Historical data temporarily unavailable',
                data: {
                    from,
                    to,
                    days: parseInt(days),
                    prices: [] // Return empty array so frontend doesn't crash
                }
            });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
