const axios = require('axios');

const BASE_URL = 'https://v6.exchangerate-api.com/v6';
const API_KEY = process.env.EXCHANGE_RATE_API_KEY;

// Simple in-memory cache to reduce API usage
let cachedCodes = null;
let lastCodesFetch = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

const getBaseUrl = () => {
    if (!API_KEY || API_KEY === 'your_key_here') {
        throw new Error('ExchangeRate API Key is missing');
    }
    return `${BASE_URL}/${API_KEY}`;
};

const getSupportedFiatCurrencies = async () => {
    const now = Date.now();
    if (cachedCodes && (now - lastCodesFetch < CACHE_DURATION)) {
        return cachedCodes;
    }

    try {
        const response = await axios.get(`${getBaseUrl()}/codes`);
        if (response.data.result === 'success') {
            // Format: [[ "AED", "UAE Dirham" ], ...]
            const codes = response.data.supported_codes.map(code => ({
                code: code[0],
                name: code[1]
            }));
            cachedCodes = codes;
            lastCodesFetch = now;
            return codes;
        } else {
            throw new Error(response.data['error-type'] || 'Failed to fetch codes');
        }
    } catch (error) {
        console.error('Error fetching fiat currencies:', error.message);
        throw error;
    }
};

const getExchangeRate = async (base, target) => {
    try {
        const response = await axios.get(`${getBaseUrl()}/pair/${base}/${target}`);
        if (response.data.result === 'success') {
            return {
                rate: response.data.conversion_rate,
                timestamp: response.data.time_last_update_unix
            };
        } else {
            throw new Error(response.data['error-type'] || 'Failed to fetch rate');
        }
    } catch (error) {
        console.error(`Error fetching rate for ${base}/${target}:`, error.message);
        throw error;
    }
};

module.exports = {
    getSupportedFiatCurrencies,
    getExchangeRate
};
