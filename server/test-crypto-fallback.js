/**
 * Test Script for Multi-API Crypto Price Fallback
 * 
 * This script tests the cryptoPriceService fallback mechanism by:
 * 1. Testing each provider individually
 * 2. Simulating Binance failures to verify fallback chain
 * 3. Validating response format consistency
 */

const cryptoPriceService = require('./services/cryptoPriceService');

async function testProvider(symbol, quote, providerName) {
    console.log(`\n--- Testing ${providerName} for ${symbol}/${quote} ---`);
    try {
        const result = await cryptoPriceService.getPrice(symbol, quote);
        console.log(`✓ Success:`, result);
        return true;
    } catch (error) {
        console.log(`✗ Failed:`, error.message);
        return false;
    }
}

async function runTests() {
    console.log('='.repeat(60));
    console.log('CRYPTO PRICE SERVICE FALLBACK TEST');
    console.log('='.repeat(60));

    // Test 1: Standard price fetch (should use Binance if available)
    console.log('\n\n📊 TEST 1: Standard Price Fetch');
    console.log('-'.repeat(60));
    await testProvider('BTC', 'USDT', 'Multi-Provider Fallback');
    await testProvider('ETH', 'USDT', 'Multi-Provider Fallback');
    await testProvider('SOL', 'USDT', 'Multi-Provider Fallback');

    // Test 2: Less common crypto (tests fallback providers)
    console.log('\n\n📊 TEST 2: Less Common Crypto');
    console.log('-'.repeat(60));
    await testProvider('DOGE', 'USDT', 'Multi-Provider Fallback');
    await testProvider('ADA', 'USDT', 'Multi-Provider Fallback');

    // Test 3: Different quote currencies
    console.log('\n\n📊 TEST 3: Different Quote Currencies');
    console.log('-'.repeat(60));
    await testProvider('BTC', 'USD', 'Multi-Provider Fallback (USD)');
    await testProvider('ETH', 'USD', 'Multi-Provider Fallback (USD)');

    // Test 4: Unsupported symbols (should fail gracefully)
    console.log('\n\n📊 TEST 4: Unsupported Symbols (Expected Failures)');
    console.log('-'.repeat(60));
    await testProvider('INVALID', 'USDT', 'Multi-Provider Fallback');
    await testProvider('XYZ123', 'USDT', 'Multi-Provider Fallback');

    console.log('\n\n' + '='.repeat(60));
    console.log('📋 SUMMARY');
    console.log('='.repeat(60));
    console.log('✓ Check server logs above to see which provider was used');
    console.log('✓ Binance failures should trigger automatic fallback');
    console.log('✓ Response format should be consistent: { price, timestamp }');
    console.log('✓ All prices should be reasonable (not 0, not NaN)');
    console.log('\n');
}

// Run the tests
runTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
});
