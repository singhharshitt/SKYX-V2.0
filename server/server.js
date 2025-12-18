require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import Routes
const currencyRoutes = require('./routes/currencies');
const convertRoutes = require('./routes/convert');
const historyRoutes = require('./routes/history');
const marketPulseRoutes = require('./routes/marketPulse');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// CORS configuration - restrict to known origins in production
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:5173',      // Vite dev server
            'http://localhost:3000',      // Alternative dev port
            'http://localhost:4173',      // Vite preview
            process.env.FRONTEND_URL      // Production Vercel URL
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

// Health Check
app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'SKYX Currency Converter API' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
