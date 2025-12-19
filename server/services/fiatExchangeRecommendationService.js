const cache = require('../utils/cacheManager');
const frankfurterService = require('./frankfurterService');
const providerMetadata = require('../data/fiatProviderMetadata.json');

const CACHE_KEY = 'fiat_exchange_recommendations';
const CACHE_TTL = 120; // 120 seconds (2 minutes)

/**
 * Calculate rate competitiveness score (0-1)
 * Higher market rate = better score
 */
function calculateRateScore(rate, avgRate) {
    if (!rate || !avgRate || avgRate === 0) return 0.5;
    // If provider rate is above average, it's better
    return Math.min(rate / avgRate, 1);
}

/**
 * Get fee score from metadata
 */
function getFeeScore(feeLevel) {
    return providerMetadata.feeScores[feeLevel] || 0.5;
}

/**
 * Get speed score from metadata
 */
function getSpeedScore(speed) {
    return providerMetadata.speedScores[speed] || 0.5;
}

/**
 * Calculate availability score
 */
function calculateAvailabilityScore(availability) {
    if (availability === 'global') return 1.0;
    if (availability.includes('europe') || availability.includes('us')) return 0.8;
    return 0.6;
}

/**
 * Calculate overall weighted score
 * Rate: 40%, Fees: 25%, Speed: 20%, Availability: 15%
 */
function calculateScore(rateScore, feeScore, speedScore, availabilityScore) {
    return (
        rateScore * 0.40 +
        feeScore * 0.25 +
        speedScore * 0.20 +
        availabilityScore * 0.15
    ) * 100; // Convert to 0-100 scale
}

/**
 * Get fiat exchange recommendations for a currency pair
 */
async function getFiatExchangeRecommendations(base = 'USD', target = 'EUR') {
    const cacheKey = `${CACHE_KEY}:${base}:${target}`;

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
        console.log('[FiatExchangeService] Returning cached data');
        return cached;
    }

    try {
        // Fetch current market rate from Frankfurter
        let marketRate = null;
        try {
            const rateData = await frankfurterService.getExchangeRate(base, target);
            marketRate = rateData.rate;
        } catch (error) {
            console.warn('[FiatExchangeService] Unable to fetch market rate:', error.message);
        }

        // If we can't get market rate, return fallback
        if (!marketRate) {
            console.log('[FiatExchangeService] Returning fallback data (no market rate)');
            const fallbackResponse = {
                updatedAt: new Date().toISOString(),
                base,
                target,
                providers: providerMetadata.fallbackProviders.map(p => ({
                    ...p,
                    rate: 0
                })),
                source: 'fallback'
            };
            cache.set(cacheKey, fallbackResponse, CACHE_TTL);
            return fallbackResponse;
        }

        // Build provider recommendations
        const recommendations = [];
        const avgRate = marketRate; // Use market rate as baseline

        for (const provider of providerMetadata.providers) {
            // Simulate provider-specific rate (market rate with small variance)
            // In production, you'd fetch actual provider rates from their APIs
            const providerRate = marketRate * (0.98 + Math.random() * 0.04);

            // Calculate scores
            const rateScore = calculateRateScore(providerRate, avgRate);
            const feeScore = getFeeScore(provider.feeLevel);
            const speedScore = getSpeedScore(provider.speed);
            const availabilityScore = calculateAvailabilityScore(provider.availability);

            const overallScore = calculateScore(
                rateScore,
                feeScore,
                speedScore,
                availabilityScore
            );

            recommendations.push({
                name: provider.name,
                logo: provider.logo,
                rate: parseFloat(providerRate.toFixed(4)),
                fees: provider.feeLevel.charAt(0).toUpperCase() + provider.feeLevel.slice(1),
                speed: provider.speed,
                availability: provider.availability === 'global' ? 'Global' :
                    provider.availability === 'europe-us' ? 'Europe & US' :
                        provider.availability.charAt(0).toUpperCase() + provider.availability.slice(1),
                bestFor: provider.bestFor,
                score: Math.round(overallScore)
            });
        }

        // Sort by score and take top 3
        recommendations.sort((a, b) => b.score - a.score);
        const topProviders = recommendations.slice(0, 3);

        const response = {
            updatedAt: new Date().toISOString(),
            base,
            target,
            providers: topProviders,
            source: 'live'
        };

        // Cache the result
        cache.set(cacheKey, response, CACHE_TTL);

        console.log(`[FiatExchangeService] Successfully fetched ${topProviders.length} recommendations for ${base}/${target}`);
        return response;

    } catch (error) {
        console.error('[FiatExchangeService] Error generating recommendations:', error.message);

        // Return fallback on any error
        const fallbackResponse = {
            updatedAt: new Date().toISOString(),
            base,
            target,
            providers: providerMetadata.fallbackProviders.map(p => ({
                ...p,
                rate: 0
            })),
            source: 'fallback'
        };
        cache.set(cacheKey, fallbackResponse, CACHE_TTL);
        return fallbackResponse;
    }
}

module.exports = {
    getFiatExchangeRecommendations
};
