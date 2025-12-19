const binanceService = require('./services/binanceService');

console.log('Testing Binance Fallback Logic\n');
console.log('================================\n');

// Mock axios to simulate HTTP 451
const axios = require('axios');
const originalGet = axios.get;

axios.get = async (url, config) => {
    if (url.includes('binance.com')) {
        console.log(`[Mock] Intercepted Binance request to: ${url}`);
        console.log('[Mock] Simulating HTTP 451 (Unavailable For Legal Reasons)\n');

        const error = new Error('Request failed with status code 451');
        error.response = {
            status: 451,
            statusText: 'Unavailable For Legal Reasons',
            data: 'Restricted from your location'
        };
        throw error;
    }
    return originalGet(url, config);
};

// Test BTC price fetch with fallback
console.log('Test 1: Fetching BTC/USDT price (should fallback to CoinGecko)');
console.log('--------------------------------------------------------------');

binanceService.getPrice('BTC', 'USDT')
    .then(result => {
        console.log('✓ Fallback successful!');
        console.log(`  Price: $${result.price.toLocaleString()}`);
        console.log(`  Timestamp: ${new Date(result.timestamp).toISOString()}`);
        console.log(`  Response format: { price: number, timestamp: number }\n`);

        console.log('Test 2: Fetching ETH/USDT price (should also fallback)');
        console.log('--------------------------------------------------------------');
        return binanceService.getPrice('ETH', 'USDT');
    })
    .then(result => {
        console.log('✓ Fallback successful!');
        console.log(`  Price: $${result.price.toLocaleString()}`);
        console.log(`  Timestamp: ${new Date(result.timestamp).toISOString()}\n`);

        console.log('========================================');
        console.log('✓ All tests passed!');
        console.log('✓ Fallback logic working correctly');
        console.log('✓ Response format unchanged');
        console.log('========================================');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n✗ Test failed:', err.message);
        console.error('Stack:', err.stack);
        process.exit(1);
    });
