const axios = require('axios');
const cache = require('../utils/cacheManager');

const BASE_URL = 'https://api.frankfurter.app';
const CACHE_TTL = 60; // 60 seconds

/**
 * Get supported currencies from Frankfurter
 * @returns {Promise<Array>} - Array of currency objects
 */
const getSupportedCurrencies = async () => {
    const cacheKey = 'frankfurter:currencies';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const response = await axios.get(`${BASE_URL}/currencies`);
        // Response format: { "USD": "United States Dollar", "EUR": "Euro", ... }
        const currencies = Object.entries(response.data).map(([code, name]) => ({
            code,
            name
        }));

        cache.set(cacheKey, currencies, 3600); // Cache for 1 hour
        return currencies;
    } catch (error) {
        console.error('Frankfurter: Error fetching currencies:', error.message);
        throw new Error('Unable to fetch currency list from Frankfurter');
    }
};

/**
 * Get exchange rate between two fiat currencies
 * @param {string} from - Source currency code
 * @param {string} to - Target currency code
 * @returns {Promise<object>} - { rate, timestamp }
 */
const getExchangeRate = async (from, to) => {
    const cacheKey = `frankfurter:rate:${from}:${to}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const response = await axios.get(`${BASE_URL}/latest`, {
            params: {
                from: from.toUpperCase(),
                to: to.toUpperCase()
            }
        });

        const rate = response.data.rates[to.toUpperCase()];
        if (!rate) {
            throw new Error(`Rate not found for ${from}/${to}`);
        }

        const result = {
            rate,
            timestamp: new Date(response.data.date).getTime()
        };

        cache.set(cacheKey, result, CACHE_TTL);
        return result;
    } catch (error) {
        console.error(`Frankfurter: Error fetching rate ${from}/${to}:`, error.message);
        throw error;
    }
};

/**
 * Convert amount from one currency to another
 * With automatic fallback to Fawaz Ahmed Currency API
 * @param {string} from - Source currency
 * @param {string} to - Target currency
 * @param {number} amount - Amount to convert
 * @returns {Promise<object>} - { rate, result }
 */
const convert = async (from, to, amount) => {
    try {
        // Primary: Frankfurter (ECB-backed)
        const { rate } = await getExchangeRate(from, to);
        return {
            rate,
            result: amount * rate
        };
    } catch (frankfurterError) {
        // Fall back to Fawaz Ahmed Currency API (CDN-based)
        console.warn(`Frankfurter failed for ${from}/${to}, using Fawaz Ahmed fallback`);
        try {
            const fawazAhmedService = require('./fawazAhmedService');
            const fallbackData = await fawazAhmedService.convert(from, to, amount);
            return fallbackData;
        } catch (fallbackError) {
            console.error('Both Frankfurter and Fawaz Ahmed failed:', fallbackError.message);
            throw new Error(`Unable to convert ${from} to ${to} - both providers failed`);
        }
    }
};

module.exports = {
    getSupportedCurrencies,
    getExchangeRate,
    convert
};
