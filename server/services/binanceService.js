const axios = require('axios');
const cache = require('../utils/cacheManager');

const BASE_URL = 'https://api.binance.com/api/v3';
const CACHE_TTL = 30; // 30 seconds for crypto (more volatile)

/**
 * Get list of supported crypto symbols from Binance
 * @returns {Promise<Array>} - Array of symbol objects
 */
const getSupportedCryptos = async () => {
    const cacheKey = 'binance:symbols';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const response = await axios.get(`${BASE_URL}/exchangeInfo`);

        // Filter for USDT pairs and extract base assets
        const usdtPairs = response.data.symbols.filter(s =>
            s.quoteAsset === 'USDT' && s.status === 'TRADING'
        );

        // Get unique base assets (cryptocurrencies)
        const cryptoMap = new Map();
        usdtPairs.forEach(pair => {
            if (!cryptoMap.has(pair.baseAsset)) {
                cryptoMap.set(pair.baseAsset, {
                    symbol: pair.baseAsset,
                    name: pair.baseAsset, // Binance doesn't provide full names
                    tradingSymbol: pair.symbol // e.g., BTCUSDT
                });
            }
        });

        const cryptos = Array.from(cryptoMap.values());
        cache.set(cacheKey, cryptos, 3600); // Cache for 1 hour
        return cryptos;
    } catch (error) {
        console.error('Binance: Error fetching crypto list:', error.message);
        throw new Error('Unable to fetch crypto list from Binance');
    }
};

/**
 * Get current price of a crypto in a specific quote currency
 * @param {string} symbol - Crypto symbol (e.g., BTC)
 * @param {string} quote - Quote currency (e.g., USDT, USD, BTC)
 * @returns {Promise<object>} - { price, timestamp }
 */
const getPrice = async (symbol, quote = 'USDT') => {
    // Normalize quote currency
    const normalizedQuote = quote.toUpperCase() === 'USD' ? 'USDT' : quote.toUpperCase();
    const pair = `${symbol.toUpperCase()}${normalizedQuote}`;

    const cacheKey = `binance:price:${pair}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const response = await axios.get(`${BASE_URL}/ticker/price`, {
            params: { symbol: pair }
        });

        const result = {
            price: parseFloat(response.data.price),
            timestamp: Date.now()
        };

        cache.set(cacheKey, result, CACHE_TTL);
        return result;
    } catch (error) {
        console.error(`Binance: Error fetching price for ${pair}:`, error.message);
        throw new Error(`Unable to fetch price for ${symbol}/${quote}`);
    }
};

/**
 * Convert from one crypto to another
 * @param {string} from - Source crypto symbol
 * @param {string} to - Target crypto symbol
 * @param {number} amount - Amount to convert
 * @returns {Promise<object>} - { rate, result }
 */
const convertCryptoToCrypto = async (from, to, amount) => {
    // Get both prices in USDT
    const fromPrice = await getPrice(from, 'USDT');
    const toPrice = await getPrice(to, 'USDT');

    // Calculate cross rate
    const rate = fromPrice.price / toPrice.price;
    const result = amount * rate;

    return { rate, result };
};

/**
 * Get historical data (klines/candlesticks)
 * @param {string} symbol - Crypto symbol
 * @param {string} quote - Quote currency (default USDT)
 * @param {number} days - Number of days
 * @returns {Promise<Array>} - Array of price points
 */
const getHistoricalData = async (symbol, quote = 'USDT', days = 7) => {
    const normalizedQuote = quote.toUpperCase() === 'USD' ? 'USDT' : quote.toUpperCase();
    const pair = `${symbol.toUpperCase()}${normalizedQuote}`;

    const cacheKey = `binance:history:${pair}:${days}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        // Determine interval based on days
        let interval = '1h';
        let limit = days * 24;

        if (days > 30) {
            interval = '1d';
            limit = days;
        }

        const response = await axios.get(`${BASE_URL}/klines`, {
            params: {
                symbol: pair,
                interval: interval,
                limit: Math.min(limit, 1000) // Binance max is 1000
            }
        });

        // Format: [timestamp, open, high, low, close, volume, ...]
        const history = response.data.map(kline => ({
            timestamp: kline[0],
            price: parseFloat(kline[4]) // Close price
        }));

        cache.set(cacheKey, history, 300); // Cache for 5 minutes
        return history;
    } catch (error) {
        console.error(`Binance: Error fetching historical data for ${pair}:`, error.message);
        throw new Error(`Unable to fetch historical data for ${symbol}/${quote}`);
    }
};

module.exports = {
    getSupportedCryptos,
    getPrice,
    convertCryptoToCrypto,
    getHistoricalData
};
