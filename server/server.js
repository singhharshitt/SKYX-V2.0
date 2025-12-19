require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import Routes
const currencyRoutes = require('./routes/currencies');
const convertRoutes = require('./routes/convert');
const historyRoutes = require('./routes/history');
const marketPulseRoutes = require('./routes/marketPulse');
const exchangeRoutes = require('./routes/exchanges');
const fiatExchangeRoutes = require('./routes/fiatExchanges');


const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// CORS configuration - restrict to known origins in production
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:5173',           // Vite dev server
            'http://localhost:3000',           // Alternative dev port
            'http://localhost:4173',           // Vite preview
            'https://skyx-v2-0.vercel.app',    // Production Vercel frontend
            'https://www.skyx-v2-0.vercel.app', // Production Vercel with www
            process.env.FRONTEND_URL           // Custom frontend URL from env
        ].filter(Boolean); // Remove undefined values

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked request from origin: ${origin}`);
            callback(null, false); // Silently reject instead of throwing error
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/currencies', currencyRoutes);
app.use('/api/convert', convertRoutes);
app.use('/api/rates', historyRoutes);
app.use('/api/market-pulse', marketPulseRoutes);
app.use('/api/exchanges', exchangeRoutes);
app.use('/api/fiat-exchanges', fiatExchangeRoutes);


// Health Check
app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'SKYX Currency Converter API' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);

    // Ensure CORS headers are ALWAYS set on errors
    const origin = req.headers.origin;
    const allowedOrigins = [
        'http://localhost:5173',           // Vite dev server
        'http://localhost:3000',           // Alternative dev port
        'http://localhost:4173',           // Vite preview
        'https://skyx-v2-0.vercel.app',    // Production Vercel frontend
        'https://www.skyx-v2-0.vercel.app', // Production Vercel with www
        process.env.FRONTEND_URL           // Custom frontend URL from env
    ].filter(Boolean);

    if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    } else if (process.env.NODE_ENV === 'development' && !origin) {
        // Development fallback for tools like Postman
        res.header('Access-Control-Allow-Origin', '*');
    }

    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
