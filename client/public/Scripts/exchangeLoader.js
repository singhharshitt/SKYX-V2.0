/**
 * Exchange Platform Loader - ENHANCED
 * Pair-aware recommendations with intelligent fallback
 * - Shows best exchange for active conversion pair
 * - Shows popular platforms when no conversion is active
 * - All exchange cards have working links
 */

(function () {
    'use strict';

    // Configuration
    const API_BASE = window.location.hostname === 'localhost'
        ? 'http://localhost:3001/api'
        : 'https://skyx-v2-0.onrender.com/api';

    const CRYPTO_API_ENDPOINT = `${API_BASE}/exchanges/recommendations`;
    const FIAT_API_ENDPOINT = `${API_BASE}/fiat-exchanges/recommendations`;

    const REFRESH_INTERVAL = 60000; // 60 seconds
    const RETRY_DELAY = 5000; // 5 seconds on error

    // Exchange URLs for working links
    const EXCHANGE_URLS = {
        'Binance': 'https://www.binance.com',
        'Coinbase': 'https://www.coinbase.com',
        'Kraken': 'https://www.kraken.com',
        'Bybit': 'https://www.bybit.com',
        'Gate.io': 'https://www.gate.io',
        'OKX': 'https://www.okx.com',
        'KuCoin': 'https://www.kucoin.com'
    };

    // Fallback popular platforms (no conversion active) - Mixed fiat and crypto
    const POPULAR_PLATFORMS = [
        {
            name: 'Binance',
            logo: 'https://assets.coingecko.com/markets/images/52/small/binance.jpg',
            trustScore: 10,
            fees: 'Low',
            liquidity: 'Very High',
            supportsFiat: true,
            supportsCrypto: true,
            kyc: 'Required',
            bestFor: ['High volume', 'Low fees'],
            status: 'Online',
            score: 92,
            recommended: 'Popular Choice',
            type: 'crypto'
        },
        {
            name: 'Wise',
            logo: 'https://wise.com/public-resources/assets/logos/wise/brand_logo.svg',
            trustScore: 10,
            fees: 'Low',
            liquidity: 'High',
            supportsFiat: true,
            supportsCrypto: false,
            kyc: 'Required',
            bestFor: ['International transfers', 'Low fees'],
            status: 'Online',
            score: 94,
            recommended: 'Best for Fiat',
            type: 'fiat'
        },
        {
            name: 'Coinbase',
            logo: 'https://assets.coingecko.com/markets/images/23/small/Coinbase_Coin_Primary.png',
            trustScore: 10,
            fees: 'Medium',
            liquidity: 'High',
            supportsFiat: true,
            supportsCrypto: true,
            kyc: 'Required',
            bestFor: ['Beginners', 'Security'],
            status: 'Online',
            score: 88,
            recommended: 'Beginner Friendly',
            type: 'crypto'
        },
        {
            name: 'Revolut',
            logo: 'https://www.revolut.com/logo.svg',
            trustScore: 9,
            fees: 'Low',
            liquidity: 'High',
            supportsFiat: true,
            supportsCrypto: true,
            kyc: 'Required',
            bestFor: ['Speed', 'Multi-currency'],
            status: 'Online',
            score: 90,
            recommended: 'Fast & Easy',
            type: 'fiat'
        }
    ];

    /**
     * Get active conversion state from converter inputs
     */
    function getConversionState() {
        const fromCurrency = document.getElementById('from-currency-select');
        const toCurrency = document.getElementById('to-currency-select');
        const fromAmount = document.getElementById('from-amount-input');

        if (!fromCurrency || !toCurrency || !fromAmount) {
            return null;
        }

        const amount = parseFloat(fromAmount.value);
        if (!amount || amount <= 0) {
            return null; // No active conversion
        }

        return {
            from: fromCurrency.value,
            to: toCurrency.value,
            amount: amount,
            isActive: true
        };
    }

    /**
     * Determine pair type (fiat-fiat, crypto-crypto, or cross)
     */
    function getPairType(from, to) {
        // Extended fiat currency list
        const fiatCurrencies = [
            'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'INR',
            'NZD', 'SGD', 'HKD', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF',
            'BRL', 'MXN', 'ZAR', 'KRW', 'THB', 'IDR', 'PHP', 'MYR', 'VND',
            'TRY', 'RUB', 'ILS', 'AED', 'SAR', 'EGP', 'NGN', 'KES', 'GHS'
        ];
        const isCrypto = (curr) => !fiatCurrencies.includes(curr.toUpperCase());

        const fromCrypto = isCrypto(from);
        const toCrypto = isCrypto(to);

        if (!fromCrypto && !toCrypto) return 'fiat';
        if (fromCrypto && toCrypto) return 'crypto';
        return 'cross';
    }

    /**
     * Create exchange card HTML with enhanced features
     */
    function createExchangeCard(exchange, index, conversionState) {
        const trustStars = '★'.repeat(Math.min(exchange.trustScore, 10));
        const bestForTags = exchange.bestFor.slice(0, 2).map(tag =>
            `<span class="exchange-tag">${tag}</span>`
        ).join('');

        // Score color gradient
        const scoreGradient = exchange.score >= 90 ? 'from-green-500 to-emerald-600' :
            exchange.score >= 75 ? 'from-blue-500 to-cyan-600' :
                'from-orange-500 to-amber-600';

        // Exchange link
        const exchangeUrl = EXCHANGE_URLS[exchange.name] || '#';

        return `
            <div class="exchange-card-modern">
                
                <div class="card-inner">
                    <!-- Card Front -->
                    <div class="card-front">
                        <!-- Score Badge (Top Right) -->
                        <div class="score-badge bg-gradient-to-br ${scoreGradient}">
                            <div class="score-value">${exchange.score}</div>
                            <div class="score-label">Score</div>
                        </div>

                        <!-- Exchange Logo & Name -->
                        <div class="exchange-header">
                            <div class="logo-container">
                                <img 
                                    src="${exchange.logo}" 
                                    alt="${exchange.name}" 
                                    class="exchange-logo"
                                    loading="lazy"
                                    onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22%3E%3Crect fill=%22%23374151%22 width=%2264%22 height=%2264%22/%3E%3C/svg%3E'"
                                />
                            </div>
                            <div class="exchange-info">
                                <h4 class="exchange-name">${exchange.name}</h4>
                                <div class="trust-rating">
                                    <span class="stars">${trustStars}</span>
                                    <span class="trust-score">${exchange.trustScore}/10</span>
                                </div>
                            </div>
                        </div>

                        <!-- Quick Stats -->
                        <div class="quick-stats">
                            <div class="stat-item">
                                <div class="stat-label">Fees</div>
                                <div class="stat-value">${exchange.fees}</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Liquidity</div>
                                <div class="stat-value">${exchange.liquidity}</div>
                            </div>
                        </div>
                        
                        ${exchange.rate && exchange.rate > 0 && conversionState && conversionState.isActive ? `
                            <div class="rate-display">
                                <div class="rate-label">Exchange Rate</div>
                                <div class="rate-value">1 ${conversionState.from} = ${exchange.rate.toFixed(4)} ${conversionState.to}</div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Card Back (Reveals on Hover) -->
                    <div class="card-back">
                        <div class="back-content">
                            <div class="detail-row">
                                <span class="detail-label">KYC:</span>
                                <span class="detail-value">${exchange.kyc}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Status:</span>
                                <span class="detail-value status-online">
                                    <span class="status-dot"></span>
                                    ${exchange.status}
                                </span>
                            </div>
                            <div class="support-icons">
                                ${exchange.supportsFiat ? '<div class="support-badge"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11H9v2h2V7zm0 4H9v4h2v-4z"></path></svg> Fiat</div>' : ''}
                                ${exchange.supportsCrypto ? '<div class="support-badge"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg> Crypto</div>' : ''}
                            </div>
                            <div class="best-for-section">
                                <div class="section-title">Best For:</div>
                                <div class="tags-container">
                                    ${bestForTags}
                                </div>
                            </div>
                            <a href="${exchangeUrl}" target="_blank" rel="noopener noreferrer" class="visit-exchange-btn">
                                Visit ${exchange.name}
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
                
                <!-- Shadow/Glow Effect -->
                <div class="card-glow"></div>
            </div>
        `;
    }

    /**
     * Update section heading based on conversion state
     */
    function updateSectionHeading(conversionState) {
        const heading = document.querySelector('.exchange-heading');
        if (!heading) return;

        // Find or create subtitle element
        let subtitle = heading.nextElementSibling;
        if (!subtitle || !subtitle.classList.contains('exchange-subtitle')) {
            subtitle = document.createElement('p');
            subtitle.className = 'exchange-subtitle text-gray-400 text-sm mt-2 text-center';
            heading.parentNode.insertBefore(subtitle, heading.nextSibling);
        }

        if (conversionState && conversionState.isActive) {
            const pairType = getPairType(conversionState.from, conversionState.to);
            const pairTypeLabel = pairType === 'fiat' ? 'Fiat' : pairType === 'crypto' ? 'Crypto' : 'Crypto ↔ Fiat';
            heading.textContent = `Best Exchanges for ${conversionState.from} → ${conversionState.to}`;
            subtitle.textContent = `Showing best prices for ${pairTypeLabel} exchange`;
            subtitle.style.display = 'block';
        } else {
            heading.textContent = 'Trusted Exchange Platforms';
            subtitle.textContent = 'Popular platforms for fiat and crypto exchanges';
            subtitle.style.display = 'block';
        }
    }

    /**
     * Render exchanges into DOM with pair-aware logic
     */
    function renderExchanges(exchanges) {
        const container = document.getElementById('exchange-grid');
        if (!container) {
            console.error('[ExchangeLoader] Container #exchange-grid not found');
            return;
        }

        // Check if conversion is active
        const conversionState = getConversionState();

        // Update section heading
        updateSectionHeading(conversionState);

        // Use appropriate data source
        let displayData = exchanges;

        // If no active conversion, use popular platforms fallback
        if (!conversionState || !conversionState.isActive) {
            displayData = POPULAR_PLATFORMS;
            console.log('[ExchangeLoader] No active conversion - showing popular platforms');
        } else {
            console.log('[ExchangeLoader] Active conversion:', conversionState.from, '→', conversionState.to);
        }

        const html = displayData.map((exchange, index) =>
            createExchangeCard(exchange, index, conversionState)
        ).join('');

        container.innerHTML = html;
    }

    /**
     * Fetch exchange data from backend - pair-aware
     */
    async function fetchExchangeData() {
        const conversionState = getConversionState();

        // If no active conversion, show popular platforms
        if (!conversionState || !conversionState.isActive) {
            console.log('[ExchangeLoader] No active conversion - showing popular platforms');
            renderExchanges(POPULAR_PLATFORMS);
            return true;
        }

        // Determine pair type and fetch appropriate data
        const pairType = getPairType(conversionState.from, conversionState.to);
        let apiEndpoint;
        let requestParams = {};

        if (pairType === 'fiat') {
            // Fiat to Fiat - use fiat exchange API
            apiEndpoint = `${FIAT_API_ENDPOINT}?base=${conversionState.from}&target=${conversionState.to}`;
        } else if (pairType === 'crypto') {
            // Crypto to Crypto - use crypto exchange API
            apiEndpoint = CRYPTO_API_ENDPOINT;
        } else {
            // Cross (Crypto ↔ Fiat) - use crypto exchange API (they support both)
            apiEndpoint = CRYPTO_API_ENDPOINT;
        }

        try {
            const response = await fetch(apiEndpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // Normalize response format (fiat API returns 'providers', crypto API returns 'exchanges')
            let exchanges = [];
            if (pairType === 'fiat' && data.success && data.providers) {
                // Transform fiat providers to exchange format
                exchanges = data.providers.map(provider => ({
                    name: provider.name,
                    logo: provider.logo,
                    trustScore: Math.min(10, Math.round((provider.score || 90) / 10)), // Convert 0-100 to 0-10
                    fees: provider.fees || 'Low',
                    liquidity: provider.availability || 'High',
                    supportsFiat: true,
                    supportsCrypto: false,
                    kyc: 'Required',
                    bestFor: provider.bestFor || ['Low fees', 'Fast transfer'],
                    status: 'Online',
                    score: provider.score || 90,
                    rate: provider.rate || 0
                }));

                // Sort by rate (best rate first) if rates are available
                if (exchanges.some(e => e.rate > 0)) {
                    exchanges.sort((a, b) => (b.rate || 0) - (a.rate || 0));
                } else {
                    // Otherwise sort by score
                    exchanges.sort((a, b) => (b.score || 0) - (a.score || 0));
                }
            } else if (data.success && data.exchanges) {
                exchanges = data.exchanges;
                // Sort crypto exchanges by score
                exchanges.sort((a, b) => (b.score || 0) - (a.score || 0));
            }

            if (exchanges.length > 0) {
                console.log(`[ExchangeLoader] Loaded ${pairType} exchange data:`, data.source || 'live');
                renderExchanges(exchanges);
                return true;
            } else {
                throw new Error('No exchanges in response');
            }
        } catch (error) {
            console.warn(`[ExchangeLoader] API error for ${pairType} pair:`, error.message, '- Using popular platforms');
            renderExchanges(POPULAR_PLATFORMS);
            return false;
        }
    }

    /**
     * Setup conversion input listeners
     */
    function setupConversionListeners() {
        const fromCurrency = document.getElementById('from-currency-select');
        const toCurrency = document.getElementById('to-currency-select');
        const fromAmount = document.getElementById('from-amount-input');
        const modeButtons = ['fiat-mode-btn', 'crypto-mode-btn', 'cross-mode-btn'];

        if (fromCurrency && toCurrency && fromAmount) {
            // Re-render on currency or amount change
            [fromCurrency, toCurrency, fromAmount].forEach(element => {
                element.addEventListener('change', () => {
                    console.log('[ExchangeLoader] Conversion state changed, updating recommendations');
                    fetchExchangeData();
                });
                element.addEventListener('input', () => {
                    // Debounce input events
                    clearTimeout(window.exchangeUpdateTimeout);
                    window.exchangeUpdateTimeout = setTimeout(() => {
                        fetchExchangeData();
                    }, 500);
                });
            });
        }

        // Listen to mode button clicks
        modeButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => {
                    console.log('[ExchangeLoader] Mode changed, updating recommendations');
                    // Small delay to let mode switch complete
                    setTimeout(() => {
                        fetchExchangeData();
                    }, 100);
                });
            }
        });
    }

    /**
     * Expose update function for external triggers (e.g., mode switches)
     */
    window.exchangeLoaderUpdate = function () {
        console.log('[ExchangeLoader] External update triggered');
        fetchExchangeData();
    };

    /**
     * Initialize and start auto-refresh
     */
    function init() {
        console.log('[ExchangeLoader] Initializing enhanced pair-aware recommendations...');

        // Setup conversion listeners for pair-aware updates
        setupConversionListeners();

        // Initial load
        fetchExchangeData().then(success => {
            if (success) {
                // Auto-refresh every 60 seconds
                setInterval(() => {
                    console.log('[ExchangeLoader] Auto-refreshing...');
                    fetchExchangeData();
                }, REFRESH_INTERVAL);
            } else {
                // Retry failed load after delay
                setTimeout(() => {
                    console.log('[ExchangeLoader] Retrying...');
                    fetchExchangeData();
                }, RETRY_DELAY);
            }
        });
    }

    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
