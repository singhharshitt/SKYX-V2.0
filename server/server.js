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
app.use(cors());
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
