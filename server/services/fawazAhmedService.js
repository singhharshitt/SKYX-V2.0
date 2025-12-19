const axios = require('axios');

/**
 * Fawaz Ahmed Currency API Service
 * CDN-based, ultra-reliable fallback for fiat exchange rates
 * 
 * Delivers via jsdelivr CDN with daily updates
 * No API key required, no rate limits
 * 
 * Source: https://github.com/fawazahmed0/currency-api
 */

const BASE_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1';

/**
 * Get exchange rate between two fiat currencies
 * @param {string} from - Source currency code (lowercase)
 * @param {string} to - Target currency code (lowercase)
 * @returns {Promise<{rate: number, timestamp: number}>}
 */
const getExchangeRate = async (from, to) => {
    const fromLower = from.toLowerCase();
    const toLower = to.toLowerCase();

    try {
        // Format: /currencies/{from}.json
        const response = await axios.get(`${BASE_URL}/currencies/${fromLower}.json`, {
            timeout: 5000
        });

        const rates = response.data[fromLower];
        if (!rates || !rates[toLower]) {
            throw new Error(`Rate not found for ${from}/${to}`);
        }

        return {
            rate: rates[toLower],
            timestamp: Date.now()
        };
    } catch (error) {
        console.error(`Fawaz Ahmed: Error fetching ${from}/${to}:`, error.message);
        throw new Error(`Fawaz Ahmed API failed: ${error.message}`);
    }
};

/**
 * Convert amount from one fiat currency to another
 * @param {string} from - Source currency
 * @param {string} to - Target currency
 * @param {number} amount - Amount to convert
 * @returns {Promise<{rate: number, result: number}>}
 */
const convert = async (from, to, amount) => {
    const { rate } = await getExchangeRate(from, to);
    return {
        rate,
        result: amount * rate
    };
};

module.exports = {
    getExchangeRate,
    convert
};
