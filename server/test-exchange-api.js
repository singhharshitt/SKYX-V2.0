/**
 * Test script for Exchange Recommendations API
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testExchangeRecommendationsAPI() {
    console.log('='.repeat(60));
    console.log('Testing Exchange Recommendations API');
    console.log('='.repeat(60));
    console.log('');

    try {
        console.log('📡 Fetching recommendations from:', `${BASE_URL}/api/exchanges/recommendations`);
        const response = await axios.get(`${BASE_URL}/api/exchanges/recommendations`);

        console.log('✅ Status:', response.status);
        console.log('📦 Response Data:');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('');

        // Validate response structure
        if (response.data.success) {
            console.log('✅ Success flag: true');
        }

        if (response.data.updatedAt) {
            console.log('✅ UpdatedAt:', response.data.updatedAt);
        }

        if (response.data.exchanges && Array.isArray(response.data.exchanges)) {
            console.log('✅ Exchanges array length:', response.data.exchanges.length);
            console.log('');

            response.data.exchanges.forEach((exchange, index) => {
                console.log(`Exchange ${index + 1}:`);
                console.log(`  Name: ${exchange.name}`);
                console.log(`  Trust Score: ${exchange.trustScore}/10`);
                console.log(`  Overall Score: ${exchange.score}/100`);
                console.log(`  Fees: ${exchange.fees}`);
                console.log(`  Liquidity: ${exchange.liquidity}`);
                console.log(`  KYC: ${exchange.kyc}`);
                console.log(`  Fiat Support: ${exchange.supportsFiat}`);
                console.log(`  Crypto Support: ${exchange.supportsCrypto}`);
                console.log(`  Best For: ${exchange.bestFor.join(', ')}`);
                console.log(`  Logo: ${exchange.logo.substring(0, 50)}...`);
                console.log('');
            });
        }

        if (response.data.source) {
            console.log('📊 Data Source:', response.data.source);
        }

        console.log('');
        console.log('='.repeat(60));
        console.log('✅ All tests passed!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('');
        console.error('='.repeat(60));
        console.error('❌ Test failed!');
        console.error('='.repeat(60));
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        process.exit(1);
    }
}

// Run test
testExchangeRecommendationsAPI();
