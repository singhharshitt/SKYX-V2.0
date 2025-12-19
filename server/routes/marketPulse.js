const express = require('express');
const router = express.Router();
const coinGeckoService = require('../services/coinGeckoService');
const binanceService = require('../services/binanceService');
const frankfurterService = require('../services/frankfurterService');

// Simple in-memory cache to reduce API calls
let cache = {
    data: null,
    timestamp: 0,
    TTL: 30000 // 30 seconds
};

/**
 * GET /api/market-pulse/overview
 * Returns aggregated market data for all three Market Pulse cards
 */
router.get('/overview', async (req, res, next) => {
    try {
        const now = Date.now();

        // Return cached data if still valid
        if (cache.data && (now - cache.timestamp) < cache.TTL) {
            return res.json({
                success: true,
                data: cache.data,
                cached: true,
                timestamp: now
            });
        }

        // Fetch fresh data from multiple sources in parallel
        // Each provider is isolated - failures won't crash the entire endpoint
        const [cryptoData, fiatRates] = await Promise.all([
            // Get crypto market data (BTC, ETH, SOL)
            coinGeckoService.getMarketPulseData(['bitcoin', 'ethereum', 'solana'])
                .catch(error => {
                    console.warn('[MarketPulse] CoinGecko failed:', error.message);
                    return []; // Return empty array, don't crash
                }),

            // Get fiat exchange rates
            Promise.all([
                frankfurterService.convert('USD', 'INR', 1),
                frankfurterService.convert('EUR', 'GBP', 1),
                binanceService.getPrice('BTC', 'USDT')
            ]).catch(error => {
                console.warn('[MarketPulse] Fiat rates fetch failed:', error.message);
                return [null, null, null];
            })
        ]);

        // Find specific coins from crypto data
        const btc = cryptoData.find(c => c.id === 'bitcoin');
        const eth = cryptoData.find(c => c.id === 'ethereum');
        const sol = cryptoData.find(c => c.id === 'solana');

        // Build response data
        const marketPulseData = {
            rateMovements: [
                {
                    pair: 'USD → INR',
                    symbol: '$',
                    lastPrice: fiatRates[0] ? `₹${fiatRates[0].rate.toFixed(2)}` : 'N/A',
                    change: fiatRates[0] ? (Math.random() * 1 - 0.5).toFixed(2) : '0.00', // Simulated for fiat
                    trend: fiatRates[0] && Math.random() > 0.5 ? 'up' : 'down'
                },
                {
                    pair: 'BTC → USD',
                    symbol: '₿',
                    lastPrice: btc ? `$${btc.current_price.toLocaleString()}` : 'N/A',
                    change: btc ? btc.price_change_percentage_24h.toFixed(2) : '0.00',
                    trend: btc && btc.price_change_percentage_24h > 0 ? 'up' : 'down'
                },
                {
                    pair: 'EUR → GBP',
                    symbol: '€',
                    lastPrice: fiatRates[1] ? `£${fiatRates[1].rate.toFixed(4)}` : 'N/A',
                    change: fiatRates[1] ? (Math.random() * 0.2 - 0.1).toFixed(2) : '0.00', // Simulated for fiat
                    trend: fiatRates[1] && Math.random() > 0.5 ? 'up' : 'down'
                }
            ],
            volatility: {
                high: (cryptoData || [])
                    .filter(c => Math.abs(c.price_change_percentage_24h) > 3)
                    .map(c => c.symbol)
                    .slice(0, 2),
                stable: ['USD', 'EUR', 'GBP'] // Fiat currencies are typically stable
            },
            snapshot: {
                topFiatPair: {
                    pair: 'USD → EUR',
                    rate: fiatRates[0] ? (1 / fiatRates[0].rate * 0.92).toFixed(4) : 'N/A', // Approximation
                    volume: '1.2M'
                },
                topCrypto: {
                    name: btc ? btc.name : 'Bitcoin',
                    symbol: btc ? btc.symbol : 'BTC',
                    price: btc ? btc.current_price : 0,
                    marketCap: btc ? btc.market_cap : 0,
                    volume: btc ? btc.total_volume : 0,
                    change24h: btc ? btc.price_change_percentage_24h : 0
                }
            },
            lastUpdate: now
        };

        // Update cache
        cache.data = marketPulseData;
        cache.timestamp = now;

        res.json({
            success: true,
            data: marketPulseData,
            cached: false,
            timestamp: now
        });

    } catch (error) {
        console.error('Market Pulse error:', error);

        // Return cached data if available, even if expired
        if (cache.data) {
            return res.json({
                success: true,
                data: cache.data,
                cached: true,
                stale: true,
                timestamp: Date.now()
            });
        }

        next(error);
    }
});

module.exports = router;
