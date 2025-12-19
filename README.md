# SKYX Currency Converter

A production-ready, real-time currency and cryptocurrency converter with interactive charts and market insights. Built with modern web technologies and deployed on Vercel (frontend) and Render (backend).

**Live Demo:** [Visit SKYX](https://your-deployed-url.vercel.app)

## ✨ Features

- **Real-Time Conversion** - Live exchange rates for 20+ fiat currencies and 15+ cryptocurrencies
- **Interactive Charts** - Historical price data with 7D/30D/90D period selection
- **Cross-Asset Support** - Convert between fiat ↔ fiat, crypto ↔ crypto, and crypto ↔ fiat
- **Market Pulse** - Real-time market movements and volatility indicators
- **Exchange Recommendations** - Curated platform suggestions based on conversion pair
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **3D Globe Visualization** - Interactive Three.js globe showing global currency coverage

---

## 🛠️ Tech Stack

### Frontend
- **Vanilla JavaScript (ES6+)** - Modern JavaScript with ES modules
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Chart.js** - Interactive price charts
- **Three.js** - 3D globe visualization
- **Formspree** - Contact form handling

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Axios** - HTTP client for API requests
- **CORS** - Cross-Origin Resource Sharing configuration
- **dotenv** - Environment variable management

### APIs (No API Keys Required)
- **Frankfurter API** - Fiat currency exchange rates
- **CoinGecko API** - Cryptocurrency prices and data
- **Binance Public API** - WebSocket for real-time crypto prices (with fallback)
- **ExchangeRate API** - Backup fiat exchange rates

### DevOps & Deployment
- **Vercel** - Frontend hosting and deployment
- **Render** - Backend hosting and deployment
- **Git & GitHub** - Version control
- **Concurrently** - Run multiple npm scripts
- **npm** - Package management
- **In-Memory Caching** - API response caching for performance

### Build Management
- **Maven** - Optional unified build and orchestration tool
  - **Why Maven?** Even though this is a Node.js/npm project, Maven provides:
    - **Unified Build Process** - Single command to build both frontend and backend
    - **Node Version Management** - Pins Node.js (v22.12.0) and npm (v10.9.0) versions via `frontend-maven-plugin`
    - **Multi-Module Management** - Coordinates client and server builds from root
    - **CI/CD Integration** - Standard Maven lifecycle for continuous integration
    - **Consistent Environments** - Ensures same Node/npm versions across all developer machines
  - **How it works:** Maven uses `frontend-maven-plugin` to execute npm commands within the Maven lifecycle
  - **When to use:** Optional - you can use npm directly or Maven for standardized builds

---

## 📁 Project Structure

```
SKYX V2/
├── client/                      # Frontend application
│   ├── index.html              # Main HTML file
│   ├── src/                    # JavaScript modules
│   │   ├── config.js           # API configuration
│   │   ├── SwappLogic.js       # Conversion logic & chart handling
│   │   ├── MarketPulse.js      # Real-time market data
│   │   ├── Navigation.js       # Navigation functionality
│   │   ├── GlobeModal.js       # 3D globe interactions
│   │   ├── ScrollAnimation.js  # Scroll animations
│   │   ├── style.css           # Tailwind CSS
│   │   └── ...
│   ├── public/                 # Static assets
│   │   ├── Scripts/            # Utility scripts
│   │   │   ├── chartPairUpdater.js
│   │   │   ├── chartStatsUpdater.js
│   │   │   ├── currencyValidator.js
│   │   │   ├── exchangeLoader.js
│   │   │   └── fiatExchangeLoader.js
│   │   ├── assets/             # Images, icons
│   │   ├── fonts/              # Custom fonts
│   │   └── styling/            # Component-specific CSS
│   ├── package.json            # Frontend dependencies
│   ├── vite.config.js          # Vite configuration
│   └── vercel.json             # Vercel deployment config
│
├── server/                      # Backend API
│   ├── server.js               # Express server entry point
│   ├── routes/                 # API route handlers
│   │   ├── convert.js          # Conversion endpoints
│   │   ├── currencies.js       # Currency list endpoints
│   │   ├── history.js          # Historical data endpoints
│   │   ├── marketPulse.js      # Market data endpoints
│   │   └── ...
│   ├── services/               # External API integrations
│   │   ├── binanceService.js   # Binance API wrapper
│   │   ├── coinGeckoService.js # CoinGecko API wrapper
│   │   ├── frankfurterService.js # Frankfurter API wrapper
│   │   ├── exchangeRateService.js
│   │   └── ...
│   ├── utils/                  # Utility functions
│   │   ├── validators.js       # Input validation
│   │   └── cacheManager.js     # In-memory caching
│   ├── data/                   # Static data files
│   ├── package.json            # Backend dependencies
│   └── .env                    # Environment variables (not in git)
│
├── package.json                # Root package.json (concurrently)
├── .gitignore                  # Git ignore rules
├── README.md                   # This file
└── QUICK_REFERENCE.md          # Developer quick reference

```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v16 or higher
- **npm** (comes with Node.js)
- **Git** (for cloning)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/SKYX-V2.git
   cd SKYX-V2
   ```

2. **Install dependencies (root)**
   ```bash
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Install server dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

### Running Locally

#### Option 1: Run Both Servers Concurrently (Recommended)
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

#### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
npm run server
# or
cd server && npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run client
# or
cd client && npm run dev
```

### Environment Variables

Create a `.env` file in the `server/` directory (optional, APIs are public):

```env
PORT=3001
NODE_ENV=development
# No API keys required - all APIs are free public endpoints
```

### Alternative: Using Maven

Maven provides a unified way to build and run the entire project with consistent Node.js versions.

#### Build Both Modules (Production)
```bash
mvn clean install
```
This will:
1. Install Node.js v22.12.0 and npm 10.9.0 locally (in `client/node` and `server/node`)
2. Run `npm install` in both client and server
3. Build the frontend (`npm run build` in client)
4. Run backend tests (`npm run test` in server)

#### Run Development Servers
```bash
# Run client dev server
cd client
mvn validate -Prun-dev

# Run server dev server  
cd server
mvn validate -Prun-dev
```

#### Build Production Bundle
```bash
# Build client only
cd client
mvn clean install

# This runs:
# - npm install
# - npm run build (creates dist/ folder)
```

#### Run Tests
```bash
# Run server tests
cd server
mvn test
```

#### Clean Build Artifacts
```bash
mvn clean
```

**Note:** You don't need Maven installed globally - the project uses it optionally. Use npm commands directly if you prefer.

---

## 📡 API Endpoints

### Currency Lists
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/currencies/fiat` | GET | List of supported fiat currencies |
| `/api/currencies/crypto` | GET | List of supported cryptocurrencies |

### Conversion
| Endpoint | Method | Query Parameters | Description |
|----------|--------|------------------|-------------|
| `/api/convert/fiat` | GET | `from`, `to`, `amount` | Fiat to fiat conversion |
| `/api/convert/crypto` | GET | `from`, `to`, `amount` | Crypto to crypto conversion |
| `/api/convert/crypto-to-fiat` | GET | `from`, `to`, `amount` | Crypto to fiat conversion |
| `/api/convert/fiat-to-crypto` | GET | `from`, `to`, `amount` | Fiat to crypto conversion |

### Historical Data
| Endpoint | Method | Query Parameters | Description |
|----------|--------|------------------|-------------|
| `/api/rates/history` | GET | `from`, `to`, `days` | Price history for charts (7/30/90 days) |

### Market Data
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/market-pulse/rate-movements` | GET | Real-time rate changes |
| `/api/market-pulse/volatility` | GET | High/stable currency indicators |
| `/api/market-pulse/snapshot` | GET | Market snapshot data |

---

## 💱 Supported Assets

### Fiat Currencies (20)
USD, EUR, GBP, JPY, INR, CAD, AUD, CHF, CNY, ZAR, BRL, MXN, SGD, HKD, NZD, SEK, NOK, DKK, PLN, RUB

### Cryptocurrencies (15)
BTC, ETH, BNB, XRP, SOL, ADA, USDT, USDC, DOGE, AVAX, DOT, MATIC, LINK, UNI, LTC

---

## 🌐 Deployment

### Frontend (Vercel)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Import project from GitHub
   - Set root directory to `client`
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`

3. **Environment Variables** (Vercel Dashboard)
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```

### Backend (Render)

1. **Create Web Service**
   - Connect GitHub repository
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `npm start`

2. **Environment Variables** (Render Dashboard)
   ```
   NODE_ENV=production
   PORT=3001
   ```

3. **CORS Configuration**
   Update `server/server.js` to allow your Vercel domain:
   ```javascript
   const allowedOrigins = [
     'https://your-app.vercel.app',
     'http://localhost:5173'
   ];
   ```

---

## 🧪 Testing

### Test Backend APIs
```bash
cd server
npm run test
```

### Manual Testing
1. Start both servers locally
2. Open `http://localhost:5173`
3. Test conversions across all modes (Fiat, Crypto, Cross)
4. Test chart period buttons (7D, 30D, 90D)
5. Verify real-time updates
6. Test contact form submission

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit changes: `git commit -m 'Add YourFeature'`
4. Push to branch: `git push origin feature/YourFeature`
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and structure
- Test all changes locally before pushing
- Update documentation for new features
- Ensure no API keys are committed

---

## 📝 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

## 📧 Contact & Support

- **Email:** support@skyx.com
- **Issues:** [GitHub Issues](https://github.com/singhharshitt/SKYX-V2/issues)
- **Live Support:** Use the contact form on the website

---

## 🙏 Acknowledgments

- **Frankfurter API** - Free fiat currency data
- **CoinGecko** - Free cryptocurrency market data
- **Binance** - Public WebSocket and REST API
- **Chart.js** - Interactive charting library
- **Three.js** - 3D graphics library
- **Vercel & Render** - Hosting and deployment platforms

---

**Built with ❤️ using modern web technologies**
