const axios = require('axios');
const cache = require('../utils/cacheManager');
const exchangeMetadata = require('../data/exchangeMetadata.json');

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const CACHE_KEY = 'exchange_recommendations';
const CACHE_TTL = 60; // 60 seconds

/**
 * Get exchange data from CoinGecko
 * Returns trust scores, volumes, and other metrics
 */
async function getExchangeDataFromCoinGecko() {
    try {
        const response = await axios.get(`${COINGECKO_BASE}/exchanges`, {
            params: {
                per_page: 20,
                page: 1
            },
            timeout: 5000
        });

        return response.data;
    } catch (error) {
        console.error('[ExchangeService] CoinGecko API error:', error.message);
        return null;
    }
}

/**
 * Calculate volume score (0-1) based on 24h volume
 */
function calculateVolumeScore(volume24h, maxVolume) {
    if (!volume24h || !maxVolume || maxVolume === 0) return 0;
    return Math.min(volume24h / maxVolume, 1);
}

/**
 * Calculate fiat support score
 */
function calculateFiatScore(exchange) {
    return exchange.supportsFiat ? 1 : 0.5;
}

/**
 * Calculate regional score (simplified - all exchanges are global)
 */
function calculateRegionalScore(exchange) {
    return exchange.regions.includes('global') ? 1 : 0.7;
}

/**
 * Get fee score from metadata
 */
function getFeeScore(feeLevel) {
    return exchangeMetadata.feeScores[feeLevel] || 0.5;
}

/**
 * Calculate overall weighted score
 * Trust: 40%, Volume: 25%, Fees: 15%, Fiat: 10%, Regional: 10%
 */
function calculateScore(trustScore, volumeScore, feeScore, fiatScore, regionalScore) {
    return (
        (trustScore / 10) * 0.40 +
        volumeScore * 0.25 +
        feeScore * 0.15 +
        fiatScore * 0.10 +
        regionalScore * 0.10
    ) * 100; // Convert to 0-100 scale
}

/**
 * Map liquidity level based on volume
 */
function getLiquidityLevel(volume24h) {
    if (volume24h > 10000000000) return 'Very High'; // > $10B
    if (volume24h > 5000000000) return 'High';       // > $5B
    if (volume24h > 1000000000) return 'Medium';     // > $1B
    return 'Low';
}

/**
 * Map fee level to display string
 */
function getFeesDisplay(feeLevel) {
    const mapping = {
        'low': 'Low',
        'medium': 'Medium',
        'high': 'High'
    };
    return mapping[feeLevel] || 'Medium';
}

/**
 * Main function to get exchange recommendations
 */
async function getExchangeRecommendations() {
    // Check cache first
    const cached = cache.get(CACHE_KEY);
    if (cached) {
        console.log('[ExchangeService] Returning cached data');
        return cached;
    }

    try {
        // Fetch from CoinGecko
        const coinGeckoData = await getExchangeDataFromCoinGecko();

        // If API fails, return fallback data
        if (!coinGeckoData || coinGeckoData.length === 0) {
            console.log('[ExchangeService] API failed, returning fallback data');
            const fallbackResponse = {
                updatedAt: new Date().toISOString(),
                exchanges: exchangeMetadata.fallbackExchanges,
                source: 'fallback'
            };
            cache.set(CACHE_KEY, fallbackResponse, CACHE_TTL);
            return fallbackResponse;
        }

        // Find max volume for normalization
        const maxVolume = Math.max(...coinGeckoData.map(e => e.trade_volume_24h_btc || 0));

        // Build exchange recommendations
        const recommendations = [];

        for (const metadata of exchangeMetadata.exchanges) {
            // Find matching exchange from CoinGecko
            const liveData = coinGeckoData.find(e => e.id === metadata.id);

            if (!liveData) continue;

            // Calculate scores
            const trustScore = liveData.trust_score || 5;
            const volume24h = liveData.trade_volume_24h_btc || 0;
            const volumeScore = calculateVolumeScore(volume24h, maxVolume);
            const feeScore = getFeeScore(metadata.feeLevel);
            const fiatScore = calculateFiatScore(metadata);
            const regionalScore = calculateRegionalScore(metadata);

            const overallScore = calculateScore(
                trustScore,
                volumeScore,
                feeScore,
                fiatScore,
                regionalScore
            );

            recommendations.push({
                name: metadata.name,
                logo: metadata.logo,
                trustScore: trustScore,
                fees: getFeesDisplay(metadata.feeLevel),
                liquidity: getLiquidityLevel(volume24h),
                supportsFiat: metadata.supportsFiat,
                supportsCrypto: metadata.supportsCrypto,
                kyc: metadata.kyc,
                bestFor: metadata.bestFor,
                status: 'Online',
                score: Math.round(overallScore)
            });
        }

        // Sort by score and take top 3
        recommendations.sort((a, b) => b.score - a.score);
        const topExchanges = recommendations.slice(0, 3);

        const response = {
            updatedAt: new Date().toISOString(),
            exchanges: topExchanges,
            source: 'live'
        };

        // Cache the result
        cache.set(CACHE_KEY, response, CACHE_TTL);

        console.log(`[ExchangeService] Successfully fetched ${topExchanges.length} recommendations`);
        return response;

    } catch (error) {
        console.error('[ExchangeService] Error generating recommendations:', error.message);

        // Return fallback on any error
        const fallbackResponse = {
            updatedAt: new Date().toISOString(),
            exchanges: exchangeMetadata.fallbackExchanges,
            source: 'fallback'
        };
        cache.set(CACHE_KEY, fallbackResponse, CACHE_TTL);
        return fallbackResponse;
    }
}

module.exports = {
    getExchangeRecommendations
};
