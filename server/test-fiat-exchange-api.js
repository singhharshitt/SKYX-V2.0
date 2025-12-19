/**
 * Test script for Fiat Exchange Recommendations API
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testFiatExchangeAPI() {
    console.log('='.repeat(60));
    console.log('Testing Fiat Exchange Recommendations API');
    console.log('='.repeat(60));
    console.log('');

    try {
        console.log('📡 Fetching recommendations from:', `${BASE_URL}/api/fiat-exchanges/recommendations?base=USD&target=EUR`);
        const response = await axios.get(`${BASE_URL}/api/fiat-exchanges/recommendations`, {
            params: {
                base: 'USD',
                target: 'EUR'
            }
        });

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

        if (response.data.base && response.data.target) {
            console.log('✅ Currency pair:', `${response.data.base}/${response.data.target}`);
        }

        if (response.data.providers && Array.isArray(response.data.providers)) {
            console.log('✅ Providers array length:', response.data.providers.length);
            console.log('');

            response.data.providers.forEach((provider, index) => {
                console.log(`Provider ${index + 1}:`);
                console.log(`  Name: ${provider.name}`);
                console.log(`  Rate: ${provider.rate}`);
                console.log(`  Overall Score: ${provider.score}/100`);
                console.log(`  Fees: ${provider.fees}`);
                console.log(`  Speed: ${provider.speed}`);
                console.log(`  Availability: ${provider.availability}`);
                console.log(`  Best For: ${provider.bestFor.join(', ')}`);
                console.log(`  Logo: ${provider.logo.substring(0, 50)}...`);
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
testFiatExchangeAPI();
