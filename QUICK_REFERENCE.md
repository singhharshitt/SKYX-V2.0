# SKYX Currency Converter - Quick Reference Guide

## 🚀 Quick Start

### Development Mode (Recommended)
```bash
# Terminal 1 - Backend (port 3001)
cd server
npm run dev

# Terminal 2 - Frontend (port 5173)
cd client
npm run dev
```

**Access:** http://localhost:5173

---

## 📦 Build Commands

### npm Workflow
```bash
# Frontend
cd client
npm install        # Install dependencies
npm run dev        # Development server (Vite)
npm run build      # Production build
npm run preview    # Preview production build

# Backend
cd server
npm install        # Install dependencies
npm run dev        # Development server (--watch)
npm start          # Production server
npm run test       # Run API tests
```

### Maven Workflow

**Why Maven for Node.js?**
- Unified build orchestration for multi-module projects
- Pins Node.js v22.12.0 and npm 10.9.0 via `frontend-maven-plugin`
- Ensures consistent environments across all developer machines
- Standard Maven lifecycle for CI/CD integration
- Optional - use npm directly if preferred

**How it works:** Maven uses `frontend-maven-plugin` to execute npm commands

```bash
# Build entire project (install deps + build frontend + run tests)
mvn clean install

# Build with production profile
mvn clean install -Pprod

# Skip tests
mvn clean install -DskipTests

# Run frontend dev server (Vite on port 5173)
cd client
mvn validate -Prun-dev

# Run backend dev server (Node.js on port 3001)
cd server
mvn validate -Prun-dev

# Run backend production server
cd server
mvn validate -Prun-start

# Run tests only
cd server
mvn test

# Clean build artifacts
mvn clean
```

**What Maven does when you run `mvn clean install`:**
1. Downloads Node.js v22.12.0 and npm 10.9.0 into `client/node` and `server/node`
2. Runs `npm install` in both client and server directories
3. Executes `npm run build` in client (creates `dist/` folder)
4. Runs `npm run test` in server (validates backend APIs)
5. Packages everything for deployment

---

## 🧭 Navigation Features

### Desktop Navigation
- **Home** → Scrolls to hero section
- **Converter** → Scrolls to converter section
- **Contact** → Scrolls to contact form

### Mobile Navigation (< 768px)
- **Hamburger Menu** → Toggle open/close
- **Click Outside** → Auto-close menu
- **Escape Key** → Close menu
- **Click Link** → Scroll + auto-close menu

### Keyboard Accessibility
- **Tab** → Navigate through links
- **Enter** → Activate link
- **Escape** → Close mobile menu

---

## 📊 Market Pulse Real-Time Data

### Data Sources
- **Crypto Prices:** Binance WebSocket (BTC, ETH, SOL)
- **Fiat Rates:** Backend API polling (USD/INR, EUR/GBP)
- **Update Frequency:** 
  - Crypto: Real-time (instant)
  - Fiat: 30 seconds

### Console Verification
```javascript
// Look for these in browser console:
[Market Pulse] Initializing WebSocket-based real-time updates...
[WebSocket] Connected: BTCUSDT
[WebSocket] Connected: ETHUSDT
[WebSocket] Connected: SOLUSDT
[Fiat] Starting polling...
```

### Features
- ✅ Live price updates
- ✅ Smooth number transitions (600ms)
- ✅ Auto-reconnection on disconnect
- ✅ Tab visibility pause/resume
- ✅ Dynamic volatility badges

---

## 📱 Responsive Design

### Breakpoints (Tailwind)
- **Mobile:** < 640px (sm)
- **Tablet:** 640px - 768px (md)
- **Desktop:** 768px+ (lg, xl)

### Globe Scaling
- **Mobile:** 50% scale
- **Tablet:** 75% scale
- **Desktop:** 100% scale

### Text Sizing
- **Headings:** 3xl → 4xl → 5xl → 7xl
- **Body:** text-sm → text-base → text-[16px]
- **Minimum:** 14px (text-sm)

---

## 🔧 Project Structure

```
SKYX V2/
├── pom.xml                      # Maven root
├── client/                      # Frontend
│   ├── pom.xml                  # Maven client module
│   ├── package.json             # npm dependencies
│   ├── index.html               # Main HTML
│   ├── public/
│   │   └── Scripts/
│   │       ├── Navigation.js    # Mobile menu + smooth scroll
│   │       ├── MarketPulse.js   # Real-time market data
│   │       ├── SwappLogic.js    # Currency converter
│   │       ├── GlobeModal.js    # 3D globe
│   │       └── ScrollAnimation.js
│   ├── src/
│   │   └── style.css            # Tailwind CSS
│   └── dist/                    # Build output
├── server/                      # Backend
│   ├── pom.xml                  # Maven server module
│   ├── package.json             # npm dependencies
│   ├── server.js                # Express server
│   ├── routes/
│   │   ├── convert.js           # Conversion endpoint
│   │   ├── currencies.js        # Currency list
│   │   ├── history.js           # Rate history
│   │   └── marketPulse.js       # Market data
│   └── services/
│       ├── binanceService.js
│       ├── coinGeckoService.js
│       ├── frankfurterService.js
│       └── exchangeRateService.js
└── node_modules/                # Dependencies
```

---

## 🌐 API Endpoints

### Backend (http://localhost:3001)

**Convert Currency:**
```
GET /api/convert?from=USD&to=EUR&amount=100
```

**Get Currencies:**
```
GET /api/currencies
```

**Get Rate History:**
```
GET /api/rates/history?from=USD&to=EUR&days=7
```

**Market Pulse:**
```
GET /api/market-pulse/overview
```

---

## 🎨 Key Features

### Currency Converter
- **Modes:** Fiat, Crypto, Cross
- **Live Rates:** Real-time exchange rates
- **Chart:** Historical price chart
- **Suggestions:** Smart exchange platform recommendations

### Market Pulse Section
- **Rate Movements:** 3 live currency pairs
- **Volatility Watch:** High/stable asset tracking
- **Market Snapshot:** Top performing assets

### Contact Form
- **EmailJS Integration:** Live email sending
- **Validation:** Real-time form validation
- **Feedback:** Success/error messages

---

## 🐛 Troubleshooting

### Frontend Not Loading
```bash
cd client
rm -rf node_modules
npm install
npm run dev
```

### Backend API Errors
```bash
cd server
rm -rf node_modules
npm install
npm run dev
```

### Market Pulse Not Updating
1. Check browser console for errors
2. Verify backend is running on port 3001
3. Check WebSocket connections in Network tab

### Maven Build Fails
```bash
# Clear Maven cache and reinstall
mvn clean install

# Force re-download of Node.js
cd client
rm -rf node node_modules
mvn clean install

# Check Maven version (requires 3.6+)
mvn --version

# Verify pom.xml configuration
cat pom.xml

# Run with debug output
mvn clean install -X
```

**Common Maven Issues:**
- **Node version mismatch:** Maven installs Node v22.12.0 locally in `node/` folder
- **Plugin errors:** Ensure `frontend-maven-plugin` version is 1.15.0
- **Build hangs:** Check if another process is using ports 5173 or 3001
- **npm WARN:** Usually safe to ignore, focus on ERROR messages

---

## ✅ Verification Checklist

### After npm install
- [ ] No errors in console
- [ ] Vite starts on port 5173
- [ ] Backend starts on port 3001

### After Page Load
- [ ] Hero section visible
- [ ] Globe renders
- [ ] Navigation links work
- [ ] Market Pulse shows data
- [ ] Converter functional

### Browser Console
- [ ] No 404 errors
- [ ] No CORS errors
- [ ] WebSocket connections active
- [ ] Market Pulse initialized

---

## 📝 Environment Variables

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
EXCHANGERATE_API_KEY=your_key_here
```

### Frontend
No environment variables needed (uses Vite defaults)

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd client
npm run build
# Deploy dist/ folder
```

### Backend (Node.js hosting)
```bash
cd server
npm install --production
npm start
```

---

## 📚 Documentation

- **Implementation Plan:** `implementation_plan.md`
- **UI Fixes:** `ui_responsiveness_fixes_walkthrough.md`
- **Navigation:** `navigation_complete_walkthrough.md`
- **Market Pulse:** `market_pulse_complete.md`
- **Maven Integration:** `maven_integration_guide.md`
- **Complete Summary:** `final_session_summary.md`

---

## 🎯 Common Tasks

### Add New Currency
1. Update backend service (e.g., `binanceService.js`)
2. Add to converter dropdown (modify SwappLogic.js)
3. Test conversion

### Change API Endpoint
1. Update in `MarketPulse.js` line 19
2. Restart frontend

### Modify Navbar
1. Edit `index.html` (lines 870-872)
2. Add corresponding section ID
3. Update `Navigation.js` if needed

### Add New Page Section
1. Add section with unique ID in `index.html`
2. Add nav link pointing to that ID
3. Smooth scroll works automatically

---

## 🏆 Best Practices

- ✅ Keep npm and Maven workflows separate
- ✅ Test in browser console for errors
- ✅ Use responsive design (mobile-first)
- ✅ Commit small, logical changes
- ✅ Update documentation
- ✅ Test on mobile devices

---

**Last Updated:** 2025-12-19  
**Version:** 1.0.0  
**Status:** Production Ready
Created by Harshit Singh