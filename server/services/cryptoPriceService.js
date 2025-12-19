const axios = require('axios');
const cache = require('../utils/cacheManager');

/**
 * Multi-API Crypto Price Fallback Service
 * 
 * Implements a priority-based fallback chain to ensure crypto prices
 * are always available, even when primary APIs fail or are blocked.
 * 
 * Fallback Order:
 * 1. Binance REST (fastest, most accurate)
 * 2. Coinbase Public API
 * 3. CoinGecko
 * 4. Kraken Public API
 * 5. CoinDesk (BTC only)
 */

const CACHE_TTL = 30; // 30 seconds

// Symbol mappings for different API providers
const SYMBOL_TO_COINGECKO = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'BNB': 'binancecoin',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'MATIC': 'matic-network',
    'DOT': 'polkadot',
    'AVAX': 'avalanche-2',
    'SHIB': 'shiba-inu',
    'LTC': 'litecoin',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'ATOM': 'cosmos'
};

/**
 * Provider 1: Binance REST API
 */
const fetchFromBinance = async (symbol, quote = 'USDT') => {
    const normalizedQuote = quote.toUpperCase() === 'USD' ? 'USDT' : quote.toUpperCase();
    const pair = `${symbol.toUpperCase()}${normalizedQuote}`;

    try {
        const response = await axios.get('https://api.binance.com/api/v3/ticker/price', {
            params: { symbol: pair },
            timeout: 5000
        });

        return {
            price: parseFloat(response.data.price),
            timestamp: Date.now(),
            provider: 'Binance'
        };
    } catch (error) {
        const status = error.response?.status;
        const errorType = status || error.code || 'unknown';
        throw new Error(`Binance failed (${errorType}): ${error.message}`);
    }
};

/**
 * Provider 2: Coinbase Public API
 */
const fetchFromCoinbase = async (symbol, quote = 'USD') => {
    const normalizedQuote = quote.toUpperCase() === 'USDT' ? 'USD' : quote.toUpperCase();
    const pair = `${symbol.toUpperCase()}-${normalizedQuote}`;

    try {
        const response = await axios.get(`https://api.coinbase.com/v2/prices/${pair}/spot`, {
            timeout: 5000
        });

        return {
            price: parseFloat(response.data.data.amount),
            timestamp: Date.now(),
            provider: 'Coinbase'
        };
    } catch (error) {
        throw new Error(`Coinbase failed: ${error.message}`);
    }
};

/**
 * Provider 3: CoinGecko
 */
const fetchFromCoinGecko = async (symbol, quote = 'USD') => {
    const coinId = SYMBOL_TO_COINGECKO[symbol.toUpperCase()];
    if (!coinId) {
        throw new Error(`CoinGecko: No mapping for ${symbol}`);
    }

    const normalizedQuote = quote.toUpperCase() === 'USDT' ? 'USD' : quote.toUpperCase();

    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
            params: {
                ids: coinId,
                vs_currencies: normalizedQuote.toLowerCase(),
                include_last_updated_at: true
            },
            timeout: 5000
        });

        if (!response.data[coinId]) {
            throw new Error('Coin not found');
        }

        return {
            price: response.data[coinId][normalizedQuote.toLowerCase()],
            timestamp: response.data[coinId].last_updated_at * 1000, // Convert to ms
            provider: 'CoinGecko'
        };
    } catch (error) {
        throw new Error(`CoinGecko failed: ${error.message}`);
    }
};

/**
 * Provider 4: Kraken Public API
 */
const fetchFromKraken = async (symbol, quote = 'USD') => {
    // Kraken uses different symbol formats (e.g., XXBTZUSD for BTC/USD)
    const krakenSymbolMap = {
        'BTC': 'XBT',
        'DOGE': 'XDG'
    };

    const krakenSymbol = krakenSymbolMap[symbol.toUpperCase()] || symbol.toUpperCase();
    const krakenQuote = quote.toUpperCase() === 'USDT' ? 'USD' : quote.toUpperCase();
    const pair = `${krakenSymbol}${krakenQuote}`;

    try {
        const response = await axios.get('https://api.kraken.com/0/public/Ticker', {
            params: { pair },
            timeout: 5000
        });

        if (response.data.error && response.data.error.length > 0) {
            throw new Error(response.data.error.join(', '));
        }

        // Kraken returns data with the pair as key (may be slightly different from input)
        const resultKey = Object.keys(response.data.result)[0];
        const tickerData = response.data.result[resultKey];

        return {
            price: parseFloat(tickerData.c[0]), // Last trade price
            timestamp: Date.now(),
            provider: 'Kraken'
        };
    } catch (error) {
        throw new Error(`Kraken failed: ${error.message}`);
    }
};

/**
 * Provider 5: CoinDesk (BTC only, fallback of last resort)
 */
const fetchFromCoinDesk = async (symbol, quote = 'USD') => {
    if (symbol.toUpperCase() !== 'BTC') {
        throw new Error('CoinDesk only supports BTC');
    }

    const normalizedQuote = quote.toUpperCase() === 'USDT' ? 'USD' : quote.toUpperCase();

    try {
        const response = await axios.get('https://api.coindesk.com/v1/bpi/currentprice.json', {
            timeout: 5000
        });

        const price = response.data.bpi[normalizedQuote]?.rate_float;
        if (!price) {
            throw new Error(`CoinDesk: ${normalizedQuote} not available`);
        }

        return {
            price,
            timestamp: new Date(response.data.time.updatedISO).getTime(),
            provider: 'CoinDesk'
        };
    } catch (error) {
        throw new Error(`CoinDesk failed: ${error.message}`);
    }
};

/**
 * Main function: Get crypto price with automatic fallback
 * 
 * @param {string} symbol - Crypto symbol (e.g., 'BTC', 'ETH')
 * @param {string} quote - Quote currency (e.g., 'USDT', 'USD')
 * @returns {Promise<{price: number, timestamp: number}>} - Price data
 */
const getPrice = async (symbol, quote = 'USDT') => {
    const cacheKey = `crypto:price:${symbol}:${quote}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        return cached;
    }

    // Fallback chain - CoinGecko PRIMARY per production requirements
    const providers = [
        { name: 'CoinGecko', fn: fetchFromCoinGecko },
        { name: 'Binance', fn: fetchFromBinance },
        { name: 'Coinbase', fn: fetchFromCoinbase },
        { name: 'Kraken', fn: fetchFromKraken },
        { name: 'CoinDesk', fn: fetchFromCoinDesk }
    ];

    let lastError = null;

    for (const provider of providers) {
        try {
            const result = await provider.fn(symbol, quote);

            // Log successful provider (server-side only)
            if (provider.name !== 'CoinGecko') {
                console.log(`[CryptoPrice] Using fallback: ${provider.name} for ${symbol}/${quote}`);
            }

            // Cache the result (without provider info to maintain compatibility)
            const cachedResult = {
                price: result.price,
                timestamp: result.timestamp
            };
            cache.set(cacheKey, cachedResult, CACHE_TTL);

            return cachedResult;
        } catch (error) {
            lastError = error;
            console.warn(`[CryptoPrice] ${provider.name} failed for ${symbol}/${quote}: ${error.message}`);
            // Continue to next provider
        }
    }

    // All providers failed
    console.error(`[CryptoPrice] All providers failed for ${symbol}/${quote}`);
    throw new Error(`Unable to fetch price for ${symbol}/${quote} - all providers failed. Last error: ${lastError?.message}`);
};

module.exports = {
    getPrice
};
