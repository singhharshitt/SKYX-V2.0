# SKYX Currency Converter

A real-time currency and cryptocurrency converter built with modern web technologies. Convert between fiat currencies (USD, EUR, GBP, INR, etc.) and cryptocurrencies (BTC, ETH, SOL, etc.) with live exchange rates and interactive price charts.

## Features

- 🔄 **Real-time Conversion**: Live exchange rates from CoinGecko and ExchangeRate-API
- 💱 **Dual Mode**: Toggle between Fiat and Cryptocurrency conversions
- 📊 **Interactive Charts**: 7-day price history visualization with Chart.js
- 🎨 **Modern UI**: Clean, responsive design with TailwindCSS
- 🔒 **Secure**: Built with best practices for production deployment
- 🌍 **Global**: Support for 20+ fiat currencies and 15+ cryptocurrencies

## Tech Stack

### Backend
- **Node.js** with Express.js
- **Axios** for API calls
- **CORS** enabled for cross-origin requests

### Frontend
- **Vanilla JavaScript** (ES6+)
- **TailwindCSS** for styling
- **Chart.js** for data visualization
- **Three.js** for 3D globe animation

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SKYX
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

#### Option 1: Using the Startup Script (Windows)
Double-click `start-dev.bat` to start both servers automatically.

#### Option 2: Manual Startup

1. **Start Backend Server**
   ```bash
   cd backend
   npm start
   ```
   Backend will run on `http://localhost:3001`

2. **Start Frontend Server** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

### Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Toggle between "Fiat" and "Crypto" modes using the switch
3. Select currencies from the dropdown menus
4. Enter an amount to convert
5. View real-time conversion results and price charts
6. Use the swap button to quickly reverse currency pairs

## API Endpoints

### Currency Lists
- `GET /api/currencies/fiat` - Get list of fiat currencies
- `GET /api/currencies/crypto` - Get list of cryptocurrencies

### Conversion
- `GET /api/convert/fiat?from=USD&to=EUR&amount=100` - Fiat to fiat conversion
- `GET /api/convert/crypto?from=BTC&to=ETH&amount=1` - Crypto to crypto conversion
- `GET /api/convert/crypto-to-fiat?from=BTC&to=USD&amount=1` - Crypto to fiat
- `GET /api/convert/fiat-to-crypto?from=USD&to=BTC&amount=1000` - Fiat to crypto

### Historical Data
- `GET /api/rates/history?from=BTC&to=USD&days=7` - Get price history for charts

## Supported Currencies

### Fiat Currencies
USD, EUR, GBP, JPY, INR, CAD, AUD, CHF, CNY, ZAR, BRL, MXN, SGD, HKD, NZD, SEK, NOK, DKK, PLN, RUB

### Cryptocurrencies
BTC, ETH, BNB, XRP, SOL, ADA, USDT, USDC, DOGE, AVAX, DOT, MATIC, LINK, UNI, LTC

## Features in Detail

### Real-time Conversion
- Automatic conversion as you type (debounced)
- Live exchange rates from reliable APIs
- Support for high-precision crypto calculations

### Interactive Charts
- 7-day price history
- Responsive design
- Smooth animations and hover effects

### User Experience
- Swap currencies with one click
- Validation to prevent same-currency conversion
- Loading states and error handling
- Mobile-responsive design

### Exchange Suggestions
- Trusted platform recommendations
- Security and rate information

## Development

### Project Structure
```
SKYX/
├── backend/
│   ├── server.js          # Express server with API routes
│   ├── package.json       # Backend dependencies
│   └── node_modules/      # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── home.html  # Main application page
│   │   ├── assets/        # Images and fonts
│   │   └── style.css      # TailwindCSS styles
│   ├── package.json       # Frontend dependencies
│   └── node_modules/      # Frontend dependencies
├── start-dev.bat          # Windows startup script
└── README.md              # This file
```

### Adding New Currencies
To add new currencies, update the currency arrays in `backend/server.js`:
- `fiatCurrencies` array for fiat currencies
- `cryptoCurrencies` array for cryptocurrencies
- Update the `cryptoIdMap` for CoinGecko API integration

## Production Deployment

### Backend
- Set `NODE_ENV=production`
- Use PM2 or similar process manager
- Configure reverse proxy (nginx/Apache)
- Set up SSL certificates

### Frontend
- Build with `npm run build`
- Serve static files with nginx or CDN
- Configure CORS for production domain

## License

This project is open source and available under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions, please open an issue on the GitHub repository.
