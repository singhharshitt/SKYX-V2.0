/**
 * API Endpoint Test Script
 * Tests all SKYX Currency Converter backend endpoints
 * 
 * Usage: node test-api.js
 */

const API_BASE = 'http://localhost:3001/api';

// ANSI color codes for terminal output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

let testsPassed = 0;
let testsFailed = 0;

/**
 * Make HTTP request
 */
async function makeRequest(url, method = 'GET') {
    try {
        const response = await fetch(url, { method });
        const data = await response.json();
        return { ok: response.ok, status: response.status, data };
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

/**
 * Log test result
 */
function logTest(name, passed, message = '') {
    if (passed) {
        console.log(`${colors.green}✓${colors.reset} ${name}`);
        if (message) console.log(`  ${colors.cyan}${message}${colors.reset}`);
        testsPassed++;
    } else {
        console.log(`${colors.red}✗${colors.reset} ${name}`);
        if (message) console.log(`  ${colors.red}${message}${colors.reset}`);
        testsFailed++;
    }
}

/**
 * Test section header
 */
function logSection(name) {
    console.log(`\n${colors.bold}${colors.blue}━━━ ${name} ━━━${colors.reset}\n`);
}

/**
 * Test health endpoint
 */
async function testHealth() {
    logSection('Health Check');

    const result = await makeRequest('http://localhost:3001/');
    logTest(
        'GET /',
        result.ok && result.data.status === 'ok',
        result.ok ? `Service: ${result.data.service}` : result.error
    );
}

/**
 * Test currency list endpoints
 */
async function testCurrencyLists() {
    logSection('Currency Lists');

    // Test fiat currencies
    const fiatResult = await makeRequest(`${API_BASE}/currencies/fiat`);
    const fiatPassed = fiatResult.ok &&
        fiatResult.data.success &&
        Array.isArray(fiatResult.data.data) &&
        fiatResult.data.data.length > 0;

    logTest(
        'GET /api/currencies/fiat',
        fiatPassed,
        fiatPassed
            ? `Found ${fiatResult.data.data.length} currencies (Source: ${fiatResult.data.source})`
            : fiatResult.error || 'Invalid response format'
    );

    // Test crypto currencies
    const cryptoResult = await makeRequest(`${API_BASE}/currencies/crypto`);
    const cryptoPassed = cryptoResult.ok &&
        cryptoResult.data.success &&
        Array.isArray(cryptoResult.data.data) &&
        cryptoResult.data.data.length > 0;

    logTest(
        'GET /api/currencies/crypto',
        cryptoPassed,
        cryptoPassed
            ? `Found ${cryptoResult.data.data.length} cryptocurrencies (Source: ${cryptoResult.data.source})`
            : cryptoResult.error || 'Invalid response format'
    );
}

/**
 * Test conversion endpoints
 */
async function testConversions() {
    logSection('Conversion Endpoints');

    // Test fiat-to-fiat
    const fiatResult = await makeRequest(`${API_BASE}/convert/fiat?from=USD&to=EUR&amount=100`);
    const fiatPassed = fiatResult.ok &&
        fiatResult.data.success &&
        fiatResult.data.data.rate > 0;

    logTest(
        'GET /api/convert/fiat (USD → EUR)',
        fiatPassed,
        fiatPassed
            ? `Rate: ${fiatResult.data.data.rate.toFixed(4)}, Result: ${fiatResult.data.data.result.toFixed(2)} EUR (${fiatResult.data.data.source})`
            : fiatResult.error || fiatResult.data.message
    );

    // Test crypto-to-crypto
    const cryptoResult = await makeRequest(`${API_BASE}/convert/crypto?from=BTC&to=ETH&amount=1`);
    const cryptoPassed = cryptoResult.ok &&
        cryptoResult.data.success &&
        cryptoResult.data.data.rate > 0;

    logTest(
        'GET /api/convert/crypto (BTC → ETH)',
        cryptoPassed,
        cryptoPassed
            ? `Rate: ${cryptoResult.data.data.rate.toFixed(4)}, Result: ${cryptoResult.data.data.result.toFixed(4)} ETH (${cryptoResult.data.data.source})`
            : cryptoResult.error || cryptoResult.data.message
    );

    // Test crypto-to-fiat
    const cryptoFiatResult = await makeRequest(`${API_BASE}/convert/crypto-to-fiat?from=BTC&to=USD&amount=1`);
    const cryptoFiatPassed = cryptoFiatResult.ok &&
        cryptoFiatResult.data.success &&
        cryptoFiatResult.data.data.rate > 0;

    logTest(
        'GET /api/convert/crypto-to-fiat (BTC → USD)',
        cryptoFiatPassed,
        cryptoFiatPassed
            ? `Rate: ${cryptoFiatResult.data.data.rate.toFixed(2)}, Result: $${cryptoFiatResult.data.data.result.toFixed(2)} (${cryptoFiatResult.data.data.source})`
            : cryptoFiatResult.error || cryptoFiatResult.data.message
    );

    // Test fiat-to-crypto
    const fiatCryptoResult = await makeRequest(`${API_BASE}/convert/fiat-to-crypto?from=USD&to=BTC&amount=50000`);
    const fiatCryptoPassed = fiatCryptoResult.ok &&
        fiatCryptoResult.data.success &&
        fiatCryptoResult.data.data.result > 0;

    logTest(
        'GET /api/convert/fiat-to-crypto (USD → BTC)',
        fiatCryptoPassed,
        fiatCryptoPassed
            ? `Rate: ${fiatCryptoResult.data.data.rate.toFixed(8)}, Result: ${fiatCryptoResult.data.data.result.toFixed(8)} BTC (${fiatCryptoResult.data.data.source})`
            : fiatCryptoResult.error || fiatCryptoResult.data.message
    );
}

/**
 * Test historical data endpoint
 */
async function testHistoricalData() {
    logSection('Historical Data');

    const historyResult = await makeRequest(`${API_BASE}/rates/history?from=BTC&to=USDT&days=7`);
    const historyPassed = historyResult.ok &&
        historyResult.data.success &&
        Array.isArray(historyResult.data.data.prices) &&
        historyResult.data.data.prices.length > 0;

    logTest(
        'GET /api/rates/history (BTC/USDT, 7 days)',
        historyPassed,
        historyPassed
            ? `Retrieved ${historyResult.data.data.prices.length} data points (${historyResult.data.source})`
            : historyResult.error || historyResult.data.message
    );
}

/**
 * Test error handling
 */
async function testErrorHandling() {
    logSection('Error Handling');

    // Test invalid currency
    const invalidResult = await makeRequest(`${API_BASE}/convert/fiat?from=INVALID&to=USD&amount=100`);
    logTest(
        'Invalid currency code handling',
        !invalidResult.ok || !invalidResult.data.success,
        'Correctly rejected invalid currency'
    );

    // Test missing parameters
    const missingResult = await makeRequest(`${API_BASE}/convert/fiat?from=USD`);
    logTest(
        'Missing parameters handling',
        !missingResult.ok || !missingResult.data.success,
        'Correctly rejected missing parameters'
    );

    // Test invalid amount
    const invalidAmountResult = await makeRequest(`${API_BASE}/convert/fiat?from=USD&to=EUR&amount=-100`);
    logTest(
        'Negative amount handling',
        !invalidAmountResult.ok || !invalidAmountResult.data.success,
        'Correctly rejected negative amount'
    );
}

/**
 * Test caching behavior
 */
async function testCaching() {
    logSection('Caching Performance');

    const endpoint = `${API_BASE}/convert/fiat?from=USD&to=EUR&amount=100`;

    // First request (uncached)
    const start1 = Date.now();
    await makeRequest(endpoint);
    const time1 = Date.now() - start1;

    // Second request (should be cached)
    const start2 = Date.now();
    const result2 = await makeRequest(endpoint);
    const time2 = Date.now() - start2;

    const isFaster = time2 < time1;

    logTest(
        'Cache improves response time',
        result2.ok && isFaster,
        `First: ${time1}ms, Cached: ${time2}ms (${isFaster ? 'faster' : 'same/slower'})`
    );
}

/**
 * Main test runner
 */
async function runTests() {
    console.log(`\n${colors.bold}${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}║   SKYX API Endpoint Test Suite        ║${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);

    console.log(`${colors.yellow}Testing API at: ${API_BASE}${colors.reset}`);

    try {
        await testHealth();
        await testCurrencyLists();
        await testConversions();
        await testHistoricalData();
        await testErrorHandling();
        await testCaching();

        // Summary
        console.log(`\n${colors.bold}${colors.blue}━━━ Test Summary ━━━${colors.reset}\n`);

        const total = testsPassed + testsFailed;
        const successRate = ((testsPassed / total) * 100).toFixed(1);

        console.log(`Total Tests: ${total}`);
        console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
        console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
        console.log(`Success Rate: ${successRate}%\n`);

        if (testsFailed === 0) {
            console.log(`${colors.bold}${colors.green}🎉 All tests passed! Backend is working correctly.${colors.reset}\n`);
            process.exit(0);
        } else {
            console.log(`${colors.bold}${colors.red}⚠️  Some tests failed. Please check the errors above.${colors.reset}\n`);
            process.exit(1);
        }

    } catch (error) {
        console.error(`\n${colors.red}${colors.bold}Fatal Error:${colors.reset} ${error.message}\n`);
        console.error(`${colors.yellow}Make sure the backend server is running on port 3001${colors.reset}\n`);
        process.exit(1);
    }
}

// Run tests
runTests();
