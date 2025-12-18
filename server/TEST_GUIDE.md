# API Testing Guide

## Quick Start

### 1. Start the Backend Server
```bash
cd server
npm start
```

### 2. Run the Test Script
Open a **new terminal** and run:
```bash
cd server
node test-api.js
```

## What the Test Script Checks

### ✅ Health Check
- Server is running and responding

### ✅ Currency Lists
- `/api/currencies/fiat` - Returns Frankfurter data
- `/api/currencies/crypto` - Returns Binance symbols

### ✅ Conversion Endpoints
- **Fiat → Fiat**: USD to EUR conversion
- **Crypto → Crypto**: BTC to ETH conversion
- **Crypto → Fiat**: BTC to USD conversion
- **Fiat → Crypto**: USD to BTC conversion

### ✅ Historical Data
- `/api/rates/history` - Returns 7 days of BTC/USDT price data

### ✅ Error Handling
- Invalid currency codes
- Missing parameters
- Negative amounts

### ✅ Caching
- Verifies cached responses are faster

## Expected Output

```
╔════════════════════════════════════════╗
║   SKYX API Endpoint Test Suite        ║
╚════════════════════════════════════════╝

Testing API at: http://localhost:3001/api

━━━ Health Check ━━━

✓ GET /
  Service: SKYX Currency Converter API

━━━ Currency Lists ━━━

✓ GET /api/currencies/fiat
  Found 30+ currencies (Source: Frankfurter)

✓ GET /api/currencies/crypto
  Found 100 cryptocurrencies (Source: Binance)

━━━ Conversion Endpoints ━━━

✓ GET /api/convert/fiat (USD → EUR)
  Rate: 0.9234, Result: 92.34 EUR (Frankfurter (ECB))

✓ GET /api/convert/crypto (BTC → ETH)
  Rate: 18.5234, Result: 18.5234 ETH (Binance)

✓ GET /api/convert/crypto-to-fiat (BTC → USD)
  Rate: 50123.45, Result: $50123.45 (Binance + Frankfurter)

✓ GET /api/convert/fiat-to-crypto (USD → BTC)
  Rate: 0.00001995, Result: 0.00099750 BTC (Frankfurter + Binance)

━━━ Historical Data ━━━

✓ GET /api/rates/history (BTC/USDT, 7 days)
  Retrieved 168 data points (Binance)

━━━ Error Handling ━━━

✓ Invalid currency code handling
  Correctly rejected invalid currency

✓ Missing parameters handling
  Correctly rejected missing parameters

✓ Negative amount handling
  Correctly rejected negative amount

━━━ Caching Performance ━━━

✓ Cache improves response time
  First: 234ms, Cached: 12ms (faster)

━━━ Test Summary ━━━

Total Tests: 12
Passed: 12
Failed: 0
Success Rate: 100.0%

🎉 All tests passed! Backend is working correctly.
```

## Troubleshooting

### Error: "Make sure the backend server is running"
**Solution**: Start the server first:
```bash
cd server
npm start
```

### Error: "EXCHANGE_RATE_API_KEY is missing"
**Solution**: Some tests may fail if API key is not set. This is expected for fallback tests. The primary APIs (Frankfurter, Binance) don't require keys.

### Tests Fail with "Unable to fetch"
**Solution**: 
1. Check internet connection
2. Verify APIs are accessible (not blocked by firewall)
3. Try again (APIs may have temporary issues)

## Manual Testing

You can also test individual endpoints using `curl`:

```bash
# Health check
curl http://localhost:3001/

# Fiat currencies
curl http://localhost:3001/api/currencies/fiat

# Crypto currencies
curl http://localhost:3001/api/currencies/crypto

# Fiat conversion
curl "http://localhost:3001/api/convert/fiat?from=USD&to=EUR&amount=100"

# Crypto conversion
curl "http://localhost:3001/api/convert/crypto?from=BTC&to=ETH&amount=1"

# Historical data
curl "http://localhost:3001/api/rates/history?from=BTC&to=USDT&days=7"
```

## Next Steps

After tests pass:
1. Test the frontend integration
2. Verify charts display correctly
3. Check currency dropdowns populate
4. Test real-time conversion updates
