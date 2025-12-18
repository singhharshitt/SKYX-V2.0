/**
 * Market Pulse - Real-Time Market Data Updates (WebSocket Edition)
 * Uses Binance WebSocket for instant crypto prices + HTTP polling for fiat rates
 * Tab-aware, memory-safe, with smooth number transitions
 */

(function () {
    'use strict';

    // ==========================
    // CONFIGURATION
    // ==========================
    const CONFIG = {
        // Binance WebSocket streams for 24h ticker data
        BINANCE_WS_URL: 'wss://stream.binance.com:9443/ws',
        CRYPTO_SYMBOLS: ['btcusdt', 'ethusdt', 'solusdt'],

        // Backend API for fiat rates and aggregated data
        API_ENDPOINT: '/api/market-pulse/overview',
        FIAT_REFRESH_INTERVAL: 30000, // 30 seconds for fiat rates

        // UI & Performance
        FADE_DURATION: 400,
        NUMBER_TRANSITION_DURATION: 600,

        // WebSocket reconnection
        RECONNECT_INTERVAL: 3000,
        MAX_RECONNECT_ATTEMPTS: 5,
        BACKOFF_MULTIPLIER: 1.5
    };

    // ==========================
    // STATE MANAGEMENT
    // ==========================
    const state = {
        // WebSocket connections
        cryptoWebSockets: new Map(),
        cryptoPrices: new Map(),

        // Fiat polling
        fiatInterval: null,
        fiatRates: new Map(),

        // Connection status
        wsReconnectAttempts: new Map(),
        isPageVisible: !document.hidden,

        // Last update times
        lastCryptoUpdate: null,
        lastFiatUpdate: null,

        // Abort controllers
        abortController: null
    };

    // ==========================
    // WEBSOCKET MANAGEMENT
    // ==========================

    /**
     * Create WebSocket connection for a specific crypto symbol
     */
    function connectCryptoWebSocket(symbol) {
        const streamName = `${symbol}@ticker`;
        const wsUrl = `${CONFIG.BINANCE_WS_URL}/${streamName}`;

        console.log(`[WebSocket] Connecting to ${symbol.toUpperCase()}...`);

        try {
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log(`[WebSocket] Connected: ${symbol.toUpperCase()}`);
                state.wsReconnectAttempts.set(symbol, 0);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleCryptoUpdate(symbol, data);
                } catch (error) {
                    console.error(`[WebSocket] Parse error for ${symbol}:`, error);
                }
            };

            ws.onerror = (error) => {
                console.error(`[WebSocket] Error for ${symbol}:`, error);
            };

            ws.onclose = () => {
                console.log(`[WebSocket] Disconnected: ${symbol.toUpperCase()}`);
                state.cryptoWebSockets.delete(symbol);

                // Attempt reconnection if page is visible
                if (state.isPageVisible) {
                    attemptReconnect(symbol);
                }
            };

            state.cryptoWebSockets.set(symbol, ws);
        } catch (error) {
            console.error(`[WebSocket] Failed to create connection for ${symbol}:`, error);
            attemptReconnect(symbol);
        }
    }

    /**
     * Handle incoming crypto price update from WebSocket
     */
    function handleCryptoUpdate(symbol, data) {
        const priceData = {
            symbol: symbol.replace('usdt', '').toUpperCase(),
            price: parseFloat(data.c),  // Current price
            change24h: parseFloat(data.P),  // 24h price change percentage
            high24h: parseFloat(data.h),
            low24h: parseFloat(data.l),
            volume24h: parseFloat(data.v),
            timestamp: data.E
        };

        state.cryptoPrices.set(symbol, priceData);
        state.lastCryptoUpdate = Date.now();

        // Update UI immediately
        updateCryptoPriceInUI(priceData);
    }

    /**
     * Attempt to reconnect WebSocket with exponential backoff
     */
    function attemptReconnect(symbol) {
        const attempts = state.wsReconnectAttempts.get(symbol) || 0;

        if (attempts >= CONFIG.MAX_RECONNECT_ATTEMPTS) {
            console.error(`[WebSocket] Max reconnect attempts reached for ${symbol}`);
            return;
        }

        state.wsReconnectAttempts.set(symbol, attempts + 1);

        const delay = CONFIG.RECONNECT_INTERVAL * Math.pow(CONFIG.BACKOFF_MULTIPLIER, attempts);
        console.log(`[WebSocket] Reconnecting ${symbol} in ${delay}ms (attempt ${attempts + 1})`);

        setTimeout(() => {
            connectCryptoWebSocket(symbol);
        }, delay);
    }

    /**
     * Connect to all crypto WebSockets
     */
    function startCryptoWebSockets() {
        console.log('[WebSocket] Starting crypto streams...');
        CONFIG.CRYPTO_SYMBOLS.forEach(symbol => {
            connectCryptoWebSocket(symbol);
        });
    }

    /**
     * Disconnect all WebSockets
     */
    function stopCryptoWebSockets() {
        console.log('[WebSocket] Stopping crypto streams...');
        state.cryptoWebSockets.forEach((ws, symbol) => {
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        });
        state.cryptoWebSockets.clear();
    }

    // ==========================
    // FIAT RATE POLLING
    // ==========================

    /**
     * Fetch fiat exchange rates from backend
     */
    async function fetchFiatRates() {
        if (state.abortController) {
            state.abortController.abort();
        }

        state.abortController = new AbortController();

        try {
            const response = await fetch(CONFIG.API_ENDPOINT, {
                signal: state.abortController.signal,
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                state.lastFiatUpdate = Date.now();
                updateFiatDataInUI(result.data);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('[Fiat] Fetch error:', error);
            }
        }
    }

    /**
     * Start polling for fiat rates
     */
    function startFiatPolling() {
        console.log('[Fiat] Starting polling...');

        // Immediate first fetch
        fetchFiatRates();

        // Set up interval
        if (state.fiatInterval) {
            clearInterval(state.fiatInterval);
        }

        state.fiatInterval = setInterval(fetchFiatRates, CONFIG.FIAT_REFRESH_INTERVAL);
    }

    /**
     * Stop polling for fiat rates
     */
    function stopFiatPolling() {
        console.log('[Fiat] Stopping polling...');

        if (state.fiatInterval) {
            clearInterval(state.fiatInterval);
            state.fiatInterval = null;
        }

        if (state.abortController) {
            state.abortController.abort();
        }
    }

    // ==========================
    // UI UPDATE FUNCTIONS
    // ==========================

    /**
     * Update crypto price in UI with smooth transition
     */
    function updateCryptoPriceInUI(priceData) {
        const { symbol, price, change24h } = priceData;

        // Find the rate item for this crypto (BTC → USD is index 1)
        if (symbol === 'BTC') {
            const rateItem = document.querySelectorAll('.rate-item')[1];
            if (!rateItem) return;

            // Update price
            const lastPriceEl = rateItem.querySelector('.text-xs.text-gray-400');
            if (lastPriceEl) {
                smoothNumberUpdate(lastPriceEl, `Last: $${formatCryptoPrice(price)}`, price);
            }

            // Update change percentage
            const changeEl = rateItem.querySelector('.rate-change');
            if (changeEl) {
                updatePriceChange(changeEl, change24h);
            }

            // Highlight movement
            highlightPriceMovement(rateItem, change24h);
        }

        // Update volatility watch
        updateVolatilityBadge(symbol, change24h);

        // Update market snapshot
        if (symbol === 'BTC') {
            updateMarketSnapshotCrypto(priceData);
        }
    }

    /**
     * Update fiat data in UI
     */
    function updateFiatDataInUI(data) {
        if (!data) return;

        // Update rate movements (USD→INR, EUR→GBP)
        if (data.rateMovements) {
            data.rateMovements.forEach((movement, index) => {
                const rateItem = document.querySelectorAll('.rate-item')[index];
                if (rateItem && (index === 0 || index === 2)) { // Skip crypto (index 1)
                    updateRateItemSmooth(rateItem, movement);
                }
            });
        }

        // Update market snapshot fiat pair
        if (data.snapshot && data.snapshot.topFiatPair) {
            updateMarketSnapshotFiat(data.snapshot.topFiatPair);
        }

        // Update last update timestamp
        updateTimestamp();
    }

    /**
     * Smooth number transition effect
     */
    function smoothNumberUpdate(element, newText, newValue) {
        if (!element) return;

        // Extract old number
        const oldText = element.textContent;
        const oldMatch = oldText.match(/[\d,]+\.?\d*/);
        const oldValue = oldMatch ? parseFloat(oldMatch[0].replace(/,/g, '')) : 0;

        if (Math.abs(newValue - oldValue) < 0.01) return; // Skip tiny changes

        // Animated counter
        const startTime = performance.now();
        const duration = CONFIG.NUMBER_TRANSITION_DURATION;

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentValue = oldValue + (newValue - oldValue) * eased;

            element.textContent = newText.replace(/[\d,]+\.?\d*/, formatCryptoPrice(currentValue));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }

        requestAnimationFrame(animate);
    }

    /**
     * Update price change indicator with arrow
     */
    function updatePriceChange(changeEl, changePercent) {
        if (!changeEl) return;

        const isPositive = changePercent >= 0;
        const sign = isPositive ? '+' : '';

        // Update class for color
        changeEl.className = `rate-change ${isPositive ? 'trend-up' : 'trend-down'} animate-pulse-slow flex items-center gap-2`;

        // Update text
        const textNode = Array.from(changeEl.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
        if (textNode) {
            textNode.textContent = `${sign}${Math.abs(changePercent).toFixed(2)}%`;
        }

        // Update SVG arrow
        const svg = changeEl.querySelector('svg path');
        if (svg) {
            svg.setAttribute('d', isPositive
                ? 'M5 10l7-7m0 0l7 7m-7-7v18'
                : 'M19 14l-7 7m0 0l-7-7m7 7V3'
            );
        }
    }

    /**
     * Highlight price movement with subtle flash
     */
    function highlightPriceMovement(element, change) {
        if (!element || Math.abs(change) < 0.5) return;

        const color = change > 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';

        element.style.transition = 'background-color 300ms ease';
        element.style.backgroundColor = color;

        setTimeout(() => {
            element.style.backgroundColor = '';
        }, 600);
    }

    /**
     * Update volatility badge
     */
    function updateVolatilityBadge(symbol, change24h) {
        const isHighVolatility = Math.abs(change24h) > 3;

        if (isHighVolatility) {
            const highBadges = document.querySelectorAll('.volatility-badge.high span:last-child');
            highBadges.forEach((badge, index) => {
                if (badge.textContent === symbol || (index === 0 && symbol === 'BTC') || (index === 1 && symbol === 'SOL')) {
                    fadeUpdate(badge, symbol);
                }
            });
        }
    }

    /**
     * Update market snapshot crypto section
     */
    function updateMarketSnapshotCrypto(priceData) {
        const snapshotItems = document.querySelectorAll('.snapshot-item');
        if (snapshotItems.length < 2) return;

        const cryptoSection = snapshotItems[1];

        // Update price
        const priceElements = cryptoSection.querySelectorAll('.text-sm.font-bold.text-white');
        if (priceElements[0]) {
            smoothNumberUpdate(priceElements[0], `$${formatCryptoPrice(priceData.price)}`, priceData.price);
        }

        // Update volume
        if (priceElements[1] && priceData.volume24h) {
            const volumeFormatted = formatLargeNumber(priceData.volume24h);
            fadeUpdate(priceElements[1], `$${volumeFormatted}`);
        }
    }

    /**
     * Update market snapshot fiat section
     */
    function updateMarketSnapshotFiat(fiatData) {
        const snapshotItems = document.querySelectorAll('.snapshot-item');
        if (!snapshotItems[0]) return;

        const fiatSection = snapshotItems[0];
        const metaEl = fiatSection.querySelector('.snapshot-meta');

        if (metaEl && fiatData.rate) {
            fadeUpdate(metaEl, `Live Rate: €${fiatData.rate}`);
        }
    }

    /**
     * Update rate item smoothly
     */
    function updateRateItemSmooth(rateItem, rateData) {
        const lastPriceEl = rateItem.querySelector('.text-xs.text-gray-400');
        if (lastPriceEl) {
            fadeUpdate(lastPriceEl, `Last: ${rateData.lastPrice}`);
        }

        const changeEl = rateItem.querySelector('.rate-change');
        if (changeEl) {
            updatePriceChange(changeEl, parseFloat(rateData.change));
        }
    }

    /**
     * Update timestamp display
     */
    function updateTimestamp() {
        const timestampEls = document.querySelectorAll('span.text-xs.text-gray-400');
        timestampEls.forEach(el => {
            if (el.textContent.includes('Updated:')) {
                const timeAgo = getTimeAgo(state.lastCryptoUpdate || state.lastFiatUpdate);
                fadeUpdate(el, `Updated: ${timeAgo}`);
            }
        });
    }

    // ==========================
    // UTILITY FUNCTIONS
    // ==========================

    /**
     * Fade update effect
     */
    function fadeUpdate(element, newContent) {
        if (!element || element.textContent === newContent) return;

        element.style.transition = `opacity ${CONFIG.FADE_DURATION}ms ease`;
        element.style.opacity = '0';

        setTimeout(() => {
            element.textContent = newContent;
            element.style.opacity = '1';
        }, CONFIG.FADE_DURATION / 2);
    }

    /**
     * Format crypto price with appropriate decimals
     */
    function formatCryptoPrice(price) {
        if (price > 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
        if (price > 1) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
    }

    /**
     * Format large numbers (K, M, B)
     */
    function formatLargeNumber(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toFixed(0);
    }

    /**
     * Get time ago string
     */
    function getTimeAgo(timestamp) {
        if (!timestamp) return 'just now';
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 5) return 'just now';
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    }

    // ==========================
    // LIFECYCLE MANAGEMENT
    // ==========================

    /**
     * Start all data streams
     */
    function startAllUpdates() {
        console.log('[Market Pulse] Starting real-time updates...');
        startCryptoWebSockets();
        startFiatPolling();
    }

    /**
     * Stop all data streams
     */
    function stopAllUpdates() {
        console.log('[Market Pulse] Stopping all updates...');
        stopCryptoWebSockets();
        stopFiatPolling();
    }

    /**
     * Handle page visibility changes
     */
    function handleVisibilityChange() {
        state.isPageVisible = !document.hidden;

        if (state.isPageVisible) {
            console.log('[Market Pulse] Page visible - resuming updates');
            startAllUpdates();
        } else {
            console.log('[Market Pulse] Page hidden - pausing updates');
            stopAllUpdates();
        }
    }

    /**
     * Initialize Market Pulse
     */
    function init() {
        const marketPulseSection = document.querySelector('.insight-card');

        if (!marketPulseSection) {
            console.log('[Market Pulse] Section not found on this page');
            return;
        }

        console.log('[Market Pulse] Initializing WebSocket-based real-time updates...');

        // Start updates
        startAllUpdates();

        // Handle tab visibility
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            stopAllUpdates();
        });

        // Periodic timestamp update
        setInterval(updateTimestamp, 10000); // Every 10 seconds
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
