const express = require('express');
const router = express.Router();
const frankfurterService = require('../services/frankfurterService');
const binanceService = require('../services/binanceService');
const exchangeRateService = require('../services/exchangeRateService');
const { validateConversionRequest } = require('../utils/validators');

// Helper to handle response
const sendConversionResponse = (res, from, to, amount, rate, result, source = null) => {
    res.json({
        success: true,
        data: {
            from,
            to,
            amount,
            rate,
            result,
            timestamp: Date.now(),
            ...(source && { source }) // Include API source if provided
        }
    });
};

// GET /api/convert/fiat
// Query: from, to, amount
// Strategy: Frankfurter (primary) -> ExchangeRate (fallback)
router.get('/fiat', async (req, res, next) => {
    try {
        const { from, to, amount } = req.query;
        const validation = validateConversionRequest(from, to, amount);

        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: validation.error });
        }

        const numAmount = parseFloat(amount);
        let rate, result, source;

        try {
            // Try Frankfurter first
            const conversionData = await frankfurterService.convert(from, to, numAmount);
            rate = conversionData.rate;
            result = conversionData.result;
            source = 'Frankfurter (ECB)';
        } catch (frankfurterError) {
            console.warn('Frankfurter failed, trying ExchangeRate API:', frankfurterError.message);

            // Fallback to ExchangeRate API
            try {
                const data = await exchangeRateService.getExchangeRate(from, to);
                rate = data.rate;
                result = numAmount * rate;
                source = 'ExchangeRate-API';
            } catch (fallbackError) {
                throw new Error('All fiat conversion APIs failed');
            }
        }

        sendConversionResponse(res, from, to, numAmount, rate, result, source);
    } catch (error) {
        next(error);
    }
});

// GET /api/convert/crypto
// Query: from (symbol), to (symbol), amount
// Strategy: Binance only (crypto-to-crypto via USDT bridge)
router.get('/crypto', async (req, res, next) => {
    try {
        const { from, to, amount } = req.query;
        const validation = validateConversionRequest(from, to, amount);

        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: validation.error });
        }

        const numAmount = parseFloat(amount);
        const { rate, result } = await binanceService.convertCryptoToCrypto(from, to, numAmount);

        sendConversionResponse(res, from, to, numAmount, rate, result, 'Binance');
    } catch (error) {
        next(error);
    }
});

// GET /api/convert/crypto-to-fiat
// Query: from (crypto symbol), to (fiat code), amount
// Strategy: Binance (crypto -> USDT) + Frankfurter (USDT/USD -> fiat)
router.get('/crypto-to-fiat', async (req, res, next) => {
    try {
        const { from, to, amount } = req.query;
        const validation = validateConversionRequest(from, to, amount);

        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: validation.error });
        }

        const numAmount = parseFloat(amount);

        // Step 1: Get crypto price in USDT from Binance
        const cryptoPrice = await binanceService.getPrice(from, 'USDT');
        const usdValue = numAmount * cryptoPrice.price;

        let finalRate, finalResult;

        // Step 2: Convert USD to target fiat currency if needed
        if (to.toUpperCase() === 'USD' || to.toUpperCase() === 'USDT') {
            // Direct conversion, no need for Frankfurter
            finalRate = cryptoPrice.price;
            finalResult = usdValue;
        } else {
            // Convert USD to target fiat using Frankfurter
            const fiatConversion = await frankfurterService.convert('USD', to, usdValue);
            finalRate = cryptoPrice.price * fiatConversion.rate;
            finalResult = fiatConversion.result;
        }

        sendConversionResponse(res, from, to, numAmount, finalRate, finalResult, 'Binance + Frankfurter');
    } catch (error) {
        next(error);
    }
});

// GET /api/convert/fiat-to-crypto
// Query: from (fiat code), to (crypto symbol), amount
// Strategy: Frankfurter (fiat -> USD) + Binance (USD -> crypto)
router.get('/fiat-to-crypto', async (req, res, next) => {
    try {
        const { from, to, amount } = req.query;
        const validation = validateConversionRequest(from, to, amount);

        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: validation.error });
        }

        const numAmount = parseFloat(amount);
        let usdValue;

        // Step 1: Convert fiat to USD using Frankfurter (if not already USD)
        if (from.toUpperCase() === 'USD') {
            usdValue = numAmount;
        } else {
            const fiatConversion = await frankfurterService.convert(from, 'USD', numAmount);
            usdValue = fiatConversion.result;
        }

        // Step 2: Get crypto price in USDT from Binance
        const cryptoPrice = await binanceService.getPrice(to, 'USDT');

        if (cryptoPrice.price === 0) {
            throw new Error('Invalid crypto price (0)');
        }

        // Calculate how much crypto we get for the USD value
        const cryptoAmount = usdValue / cryptoPrice.price;
        const rate = 1 / cryptoPrice.price; // How much crypto per 1 USD

        sendConversionResponse(res, from, to, numAmount, rate, cryptoAmount, 'Frankfurter + Binance');
    } catch (error) {
        next(error);
    }
});

module.exports = router;
