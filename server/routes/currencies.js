const express = require('express');
const router = express.Router();
const frankfurterService = require('../services/frankfurterService');
const binanceService = require('../services/binanceService');

// GET /api/currencies/fiat
// Returns supported fiat currency codes
router.get('/fiat', async (req, res, next) => {
    try {
        const currencies = await frankfurterService.getSupportedCurrencies();
        res.json({
            success: true,
            data: currencies,
            source: 'Frankfurter'
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/currencies/crypto
// Returns supported crypto currencies from Binance
router.get('/crypto', async (req, res, next) => {
    try {
        const cryptos = await binanceService.getSupportedCryptos();
        res.json({
            success: true,
            data: cryptos,
            source: 'Binance'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
