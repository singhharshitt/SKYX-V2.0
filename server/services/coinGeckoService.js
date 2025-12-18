const axios = require('axios');

const BASE_URL = 'https://api.coingecko.com/api/v3';

// CoinGecko has a free tier rate limit of 10-30 calls/minute.
// We must be careful.

const getSupportedCryptoCurrencies = async () => {
    try {
        // Fetch top coins to avoid a massive list (optional optimization, but user asked for "currency lists")
        // We will fetch the full list but maybe limit what we return or cache heavily.
        // Actually, returning thousands of coins for a dropdown is bad UI.
        // Let's stick to standard markets/list or just getting the list.
        // For simplicity and "Production Ready" feel, let's fetch markets (top 100) as "supported" for now,
        // or the simple list. The simple list is HUGE.
        // Re-reading requirements: "Return supported fiat and crypto currency codes".
        // A common strategy is to fetch top 100 by market cap for the dropdown.

        const response = await axios.get(`${BASE_URL}/coins/markets`, {
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 100,
                page: 1,
                sparkline: false
            }
        });

        return response.data.map(coin => ({
            id: coin.id,
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            current_price: coin.current_price,
            image: coin.image
        }));
    } catch (error) {
        console.error('Error fetching crypto list:', error.message);
        throw error;
    }
};

const getCryptoPrice = async (coinId, vsCurrency = 'usd') => {
    try {
        const response = await axios.get(`${BASE_URL}/simple/price`, {
            params: {
                ids: coinId,
                vs_currencies: vsCurrency,
                include_last_updated_at: true
            }
        });

        // Response format: { "bitcoin": { "usd": 50000, "last_updated_at": ... } }
        if (!response.data[coinId]) {
            throw new Error('Coin not found');
        }

        return {
            price: response.data[coinId][vsCurrency.toLowerCase()],
            timestamp: response.data[coinId].last_updated_at
        };
    } catch (error) {
        console.error(`Error fetching price for ${coinId}:`, error.message);
        throw error;
    }
};

const getHistoricalData = async (coinId, vsCurrency, days) => {
    try {
        const response = await axios.get(`${BASE_URL}/coins/${coinId}/market_chart`, {
            params: {
                vs_currency: vsCurrency,
                days: days
            }
        });

        // response.data.prices is array of [timestamp, price]
        return response.data.prices.map(([timestamp, price]) => ({
            timestamp,
            price
        }));
    } catch (error) {
        console.error('Error fetching historical data:', error.message);
        throw error;
    }
};

module.exports = {
    getSupportedCryptoCurrencies,
    getCryptoPrice,
    getHistoricalData
};
