// ========== PREMIUM REAL-TIME CONVERTER ==========

let currentMode = 'fiat';
let debounceTimer;
let priceChart = null;
let currentPeriod = '7d';

// Expanded Currency lists - All specified currencies
const fiatCurrencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD', 'CHF', 'CNY', 'ZAR',
    'BRL', 'MXN', 'SGD', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'RUB'
];

const cryptoCurrencies = [
    'BTC', 'ETH', 'BNB', 'XRP', 'SOL', 'ADA', 'USDT', 'USDC', 'DOGE',
    'AVAX', 'DOT', 'MATIC', 'LINK', 'UNI', 'LTC'
];

// API Base URL - uses global config with fallback
const API_BASE_URL = window.API_CONFIG?.API_BASE_URL || (() => { throw new Error('API configuration not loaded'); })();

// FIXED: Function to swap currencies (for backward compatibility)
function swapCurrencies() {
    const fromAmount = document.getElementById('from-amount-input'); // Changed from 'from-amount'
    const fromCurrency = document.getElementById('from-currency-select'); // Changed from 'from-currency'
    const toAmount = document.getElementById('to-amount-input'); // Changed from 'to-amount'
    const toCurrency = document.getElementById('to-currency-select'); // Changed from 'to-currency'

    if (!fromAmount || !fromCurrency || !toAmount || !toCurrency) return;

    const tempAmount = fromAmount.value;
    const tempCurrency = fromCurrency.value;

    fromAmount.value = toAmount.value;
    fromCurrency.value = toCurrency.value;
    toAmount.value = tempAmount;
    toCurrency.value = tempCurrency;
}

// Switch between Fiat, Crypto, and Cross modes
function switchMode(mode) {
    currentMode = mode;

    // Update button styles
    const fiatBtn = document.getElementById('fiat-mode-btn');
    const cryptoBtn = document.getElementById('crypto-mode-btn');
    const crossBtn = document.getElementById('cross-mode-btn');

    if (fiatBtn) fiatBtn.classList.toggle('active', mode === 'fiat');
    if (cryptoBtn) cryptoBtn.classList.toggle('active', mode === 'crypto');
    if (crossBtn) crossBtn.classList.toggle('active', mode === 'cross');

    // Update currency lists based on mode
    if (mode === 'cross') {
        // Cross mode: From = Crypto, To = Fiat
        updateCrossModeLists();
    } else {
        // Standard mode: same type for both
        updateCurrencyLists();
    }

    // Clear and recalculate
    const fromAmountInput = document.getElementById('from-amount-input');
    const toAmountInput = document.getElementById('to-amount-input');

    if (fromAmountInput) fromAmountInput.value = '';
    if (toAmountInput) toAmountInput.value = '';

    hideResult();

    // Exchange suggestions are now handled by exchangeLoader.js (pair-aware)
    // updateExchangeSuggestions(); // Disabled - using enhanced exchangeLoader.js instead

    // Trigger exchange loader update if it exists
    if (window.exchangeLoaderUpdate) {
        window.exchangeLoaderUpdate();
    }
}

// Update currency dropdown lists based on standard mode (fiat or crypto)
function updateCurrencyLists() {
    const fromSelect = document.getElementById('from-currency-select');
    const toSelect = document.getElementById('to-currency-select');

    if (!fromSelect || !toSelect) return;

    const currencies = currentMode === 'fiat' ? fiatCurrencies : cryptoCurrencies;

    fromSelect.innerHTML = currencies.map(curr => `<option value="${curr}">${curr}</option>`).join('');
    toSelect.innerHTML = currencies.map(curr => `<option value="${curr}">${curr}</option>`).join('');

    // Set different defaults
    if (currencies.length > 1) {
        toSelect.selectedIndex = 1;
    }

    // FIXED: Set the default from currency
    fromSelect.value = currencies[0];
    toSelect.value = currencies[1] || currencies[0];
}

// Update for cross-mode conversion (crypto to fiat)
function updateCrossModeLists() {
    const fromSelect = document.getElementById('from-currency-select');
    const toSelect = document.getElementById('to-currency-select');

    if (!fromSelect || !toSelect) return;

    // From dropdown: Cryptocurrencies
    fromSelect.innerHTML = cryptoCurrencies.map(curr => `<option value="${curr}">${curr}</option>`).join('');

    // To dropdown: Fiat currencies
    toSelect.innerHTML = fiatCurrencies.map(curr => `<option value="${curr}">${curr}</option>`).join('');

    // Set defaults
    fromSelect.value = 'BTC';
    toSelect.value = 'USD';
}

// Debounced input handler for real-time conversion
function handleAmountChange() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const amountInput = document.getElementById('from-amount-input');
        const amount = amountInput ? amountInput.value : '';
        if (amount && parseFloat(amount) > 0) {
            performConversion();
        }
    }, 500);
}

// Handle currency change
function handleCurrencyChange() {
    const amountInput = document.getElementById('from-amount-input');
    const amount = amountInput ? amountInput.value : '';
    if (amount && parseFloat(amount) > 0) {
        performConversion();
    }
    updateChart();
}

// Perform conversion using API
async function performConversion() {
    const fromAmountInput = document.getElementById('from-amount-input');
    const fromSelect = document.getElementById('from-currency-select');
    const toSelect = document.getElementById('to-currency-select');
    const toAmountInput = document.getElementById('to-amount-input');

    if (!fromAmountInput || !fromSelect || !toSelect || !toAmountInput) {
        console.error('Required elements not found');
        return;
    }

    const fromAmount = fromAmountInput.value;
    const fromCurrency = fromSelect.value;
    const toCurrency = toSelect.value;

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    try {
        let rate, result;
        let endpoint;

        if (currentMode === 'fiat') {
            // Fiat conversion using backend API
            endpoint = `${API_BASE_URL}/convert/fiat?from=${fromCurrency}&to=${toCurrency}&amount=${fromAmount}`;
        } else if (currentMode === 'crypto') {
            // Crypto conversion using backend API
            endpoint = `${API_BASE_URL}/convert/crypto?from=${fromCurrency}&to=${toCurrency}&amount=${fromAmount}`;
        } else if (currentMode === 'cross') {
            // Cross-mode: Crypto to Fiat conversion
            endpoint = `${API_BASE_URL}/convert/crypto-to-fiat?from=${fromCurrency}&to=${toCurrency}&amount=${fromAmount}`;
        }

        const response = await fetch(endpoint);
        const responseData = await response.json();

        if (!response.ok || !responseData.success) {
            throw new Error(responseData.message || 'Conversion failed');
        }

        // Extract data from backend response
        rate = responseData.data.rate;
        result = responseData.data.result;

        // Update UI
        toAmountInput.value = result.toFixed(6);

        // Update result panel if it exists
        const resultValueEl = document.getElementById('result-value-premium');
        const exchangeRateEl = document.getElementById('exchange-rate-premium');
        const lastUpdatedEl = document.getElementById('last-updated');

        if (resultValueEl) {
            resultValueEl.textContent = `${result.toFixed(2)} ${toCurrency}`;
        }
        if (exchangeRateEl) {
            exchangeRateEl.textContent = `1 ${fromCurrency} = ${rate.toFixed(6)} ${toCurrency}`;
        }
        if (lastUpdatedEl) {
            lastUpdatedEl.textContent = new Date().toLocaleTimeString();
        }

        showResult();
        updateChart();

    } catch (error) {
        console.error('Conversion error:', error);
        alert('Unable to fetch exchange rate. Please try again.');
    }
}

// Swap currencies with real-time update
function swapCurrenciesRealTime() {
    const fromCurrencySelect = document.getElementById('from-currency-select');
    const toCurrencySelect = document.getElementById('to-currency-select');

    if (!fromCurrencySelect || !toCurrencySelect) return;

    // Swap currency selections
    const tempCurrency = fromCurrencySelect.value;
    fromCurrencySelect.value = toCurrencySelect.value;
    toCurrencySelect.value = tempCurrency;

    // Recalculate if there's an amount
    const amountInput = document.getElementById('from-amount-input');
    const amount = amountInput ? amountInput.value : '';
    if (amount && parseFloat(amount) > 0) {
        performConversion();
    } else {
        updateChart();
    }
}

// Show result panel
function showResult() {
    const panel = document.getElementById('result-panel-premium');
    if (panel) {
        panel.classList.remove('hidden');
    }
}

// Hide result panel
function hideResult() {
    const panel = document.getElementById('result-panel-premium');
    if (panel) {
        panel.classList.add('hidden');
    }
}

// Update Chart with live data
async function updateChart() {
    const fromCurrencySelect = document.getElementById('from-currency-select');
    const toCurrencySelect = document.getElementById('to-currency-select');

    if (!fromCurrencySelect || !toCurrencySelect) {
        console.warn('[Chart] Currency select elements not found');
        return;
    }

    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;

    const placeholder = document.getElementById('chart-placeholder-premium');
    const chartCanvas = document.getElementById('price-chart');

    if (!placeholder || !chartCanvas) {
        console.warn('[Chart] Chart canvas or placeholder not found');
        return;
    }

    try {
        let chartData;

        if (currentMode === 'crypto' || currentMode === 'cross') {
            // Fetch crypto historical data from backend
            const days = currentPeriod === '7d' ? 7 : currentPeriod === '30d' ? 30 : 90;
            const targetCurrency = currentMode === 'cross' ? toCurrency : 'USDT';

            console.log(`[Chart] Fetching ${days} days of data for ${fromCurrency}/${targetCurrency}`);

            const response = await fetch(
                `${API_BASE_URL}/rates/history?from=${fromCurrency}&to=${targetCurrency}&days=${days}`
            );
            const responseData = await response.json();

            if (responseData.success && responseData.data.prices && responseData.data.prices.length > 0) {
                // Sort data by timestamp to ensure chronological order
                const sortedPrices = responseData.data.prices.sort((a, b) => a.timestamp - b.timestamp);

                chartData = {
                    labels: sortedPrices.map((item, i) => {
                        // Use actual timestamp if available, otherwise use day number
                        return item.timestamp ? new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `Day ${i + 1}`;
                    }),
                    values: sortedPrices.map(p => p.price),
                    timestamps: sortedPrices.map(p => p.timestamp || Date.now() - (days - i) * 24 * 60 * 60 * 1000)
                };
                console.log(`[Chart] Successfully loaded ${chartData.values.length} data points`);
            } else {
                console.warn('[Chart] No price data returned from API');
                throw new Error('No historical data available');
            }
        } else {
            // For fiat, generate sample data (real API would require paid service)
            const days = currentPeriod === '7d' ? 7 : currentPeriod === '30d' ? 30 : 90;
            const baseValue = 1.0;
            const now = Date.now();

            chartData = {
                labels: Array.from({ length: days }, (_, i) => {
                    const date = new Date(now - (days - i - 1) * 24 * 60 * 60 * 1000);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }),
                values: Array.from({ length: days }, () =>
                    baseValue + (Math.random() - 0.5) * 0.1),
                timestamps: Array.from({ length: days }, (_, i) => now - (days - i - 1) * 24 * 60 * 60 * 1000)
            };
            console.log(`[Chart] Generated ${days} days of fiat sample data`);
        }

        // Defensive check: ensure we have valid data
        if (!chartData || !chartData.values || chartData.values.length === 0) {
            throw new Error('Chart data is empty or invalid');
        }

        // Hide placeholder, show chart
        placeholder.classList.add('hidden');
        chartCanvas.classList.remove('hidden');

        renderChart(chartData);

        // Update chart stats with real data from the chart
        updateChartStats(chartData, toCurrency);

    } catch (error) {
        console.error('[Chart] Error updating chart:', error);
        // Show placeholder on error
        placeholder.classList.remove('hidden');
        chartCanvas.classList.add('hidden');
    }
}

// Render chart using Chart.js
function renderChart(data) {
    const chartCanvas = document.getElementById('price-chart');
    if (!chartCanvas) {
        console.warn('[Chart] Canvas element not found');
        return;
    }

    const ctx = chartCanvas.getContext('2d', {
        alpha: true,
        desynchronized: false
    });

    // Destroy existing chart instance
    if (priceChart) {
        priceChart.destroy();
        priceChart = null;
    }

    // Calculate Y-axis range with 5% padding for better visibility of fluctuations
    const minValue = Math.min(...data.values);
    const maxValue = Math.max(...data.values);
    const range = maxValue - minValue;
    const padding = range * 0.05;
    const suggestedMin = minValue - padding;
    const suggestedMax = maxValue + padding;

    console.log(`[Chart] Rendering chart with ${data.values.length} points, range: ${minValue.toFixed(6)} - ${maxValue.toFixed(6)}`);

    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Price History',
                data: data.values,
                borderColor: '#FF6F00',
                backgroundColor: 'rgba(255, 111, 0, 0.2)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#FF6F00',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 3,
                pointBackgroundColor: '#FF6F00',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            },
            layout: {
                padding: {
                    top: 10,
                    right: 15,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#e2e8f0',
                    borderColor: '#FF6F00',
                    borderWidth: 2,
                    padding: 12,
                    titleFont: {
                        size: 13,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 14,
                        weight: '600'
                    },
                    displayColors: false,
                    callbacks: {
                        title: function (context) {
                            // Show date/label in title
                            return context[0].label;
                        },
                        label: function (context) {
                            // Show price with 6 decimal precision
                            return `Price: ${context.parsed.y.toFixed(6)}`;
                        },
                        afterLabel: function (context) {
                            // Show timestamp if available
                            if (data.timestamps && data.timestamps[context.dataIndex]) {
                                const date = new Date(data.timestamps[context.dataIndex]);
                                return `Time: ${date.toLocaleTimeString()}`;
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: false,
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: false,
                    suggestedMin: suggestedMin,
                    suggestedMax: suggestedMax,
                    position: 'right',
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        lineWidth: 1,
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        padding: 8,
                        maxTicksLimit: 6,
                        callback: function (value) {
                            return value.toFixed(4);
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            elements: {
                line: {
                    borderJoinStyle: 'round',
                    borderCapStyle: 'round'
                }
            }
        }
    });

    console.log('[Chart] Chart rendered successfully');
}

// Update chart stats display with actual data
function updateChartStats(chartData, currency) {
    if (!chartData || !chartData.values || chartData.values.length === 0) {
        console.warn('[Chart Stats] No data available to update stats');
        return;
    }

    const currentRateDisplay = document.getElementById('current-rate-display');
    const rateChange = document.getElementById('rate-change');
    const high24h = document.getElementById('high-24h');
    const low24h = document.getElementById('low-24h');

    if (!currentRateDisplay) {
        console.warn('[Chart Stats] Stats elements not found');
        return;
    }

    try {
        const prices = chartData.values;

        // Current rate is the most recent price
        const currentRate = prices[prices.length - 1];

        // Calculate high and low from the data
        const highValue = Math.max(...prices);
        const lowValue = Math.min(...prices);

        // Calculate percentage change (current vs first price in dataset)
        const firstPrice = prices[0];
        const priceChange = ((currentRate - firstPrice) / firstPrice) * 100;

        // Update Current Rate
        currentRateDisplay.textContent = `${currentRate.toFixed(6)} ${currency}`;

        // Update 24h High
        if (high24h) {
            high24h.textContent = `${highValue.toFixed(6)} ${currency}`;
        }

        // Update 24h Low
        if (low24h) {
            low24h.textContent = `${lowValue.toFixed(6)} ${currency}`;
        }

        // Update Rate Change
        if (rateChange) {
            const changeText = `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`;
            rateChange.textContent = changeText;
            rateChange.className = `stat-change ${priceChange >= 0 ? 'positive' : 'negative'}`;
        }

        console.log(`[Chart Stats] Updated - Rate: ${currentRate.toFixed(6)}, High: ${highValue.toFixed(6)}, Low: ${lowValue.toFixed(6)}, Change: ${priceChange.toFixed(2)}%`);

    } catch (error) {
        console.error('[Chart Stats] Error updating stats:', error);
    }
}

// Change chart period
function changeChartPeriod(period) {
    console.log(`[Chart] Changing period to ${period}`);
    currentPeriod = period;

    // Update button styles - FIXED: Use correct selector
    const chartBtns = document.querySelectorAll('.period-btn');
    chartBtns.forEach(btn => {
        if (btn.dataset.period === period) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    updateChart();
}

// Append new data point for real-time updates (smooth, no redraw)
function appendChartData(newPrice, timestamp) {
    if (!priceChart) {
        console.warn('[Chart] No chart instance to append data to');
        return;
    }

    const now = timestamp || Date.now();
    const label = new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Add new data point
    priceChart.data.labels.push(label);
    priceChart.data.datasets[0].data.push(newPrice);

    // Limit to last 100 points to prevent memory issues
    if (priceChart.data.labels.length > 100) {
        priceChart.data.labels.shift();
        priceChart.data.datasets[0].data.shift();
    }

    // Update without animation for smooth real-time feel
    priceChart.update('none');
    console.log(`[Chart] Appended new data point: ${newPrice}`);
}

// Setup period button click handlers
function setupPeriodButtons() {
    const periodButtons = document.querySelectorAll('.period-btn');

    if (periodButtons.length === 0) {
        console.warn('[Chart] No period buttons found');
        return;
    }

    periodButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const period = this.dataset.period;
            if (period) {
                changeChartPeriod(period);
            }
        });
    });

    console.log(`[Chart] Attached click handlers to ${periodButtons.length} period buttons`);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    console.log('[Converter] Initializing...');

    updateCurrencyLists();

    // Setup period button click handlers
    setupPeriodButtons();

    // Load initial chart with default currencies after a brief delay
    // This ensures all DOM elements are fully ready
    setTimeout(() => {
        console.log('[Chart] Loading initial chart...');
        updateChart();
    }, 500);

    // Exchange suggestions are now handled by exchangeLoader.js (pair-aware)
    // updateExchangeSuggestions(); // Disabled - using enhanced exchangeLoader.js instead

    console.log('[Converter] Initialization complete');
});

// ========== EXCHANGE SUGGESTIONS LOGIC ==========

// Exchange platform data
const exchangePlatforms = {
    fiat: [
        {
            name: 'Wise',
            icon: '💱',
            badges: ['Low Fees', 'Trusted'],
            features: ['Best Rates', 'Fast Transfer'],
            link: '#'
        },
        {
            name: 'Revolut',
            icon: '🏦',
            badges: ['Instant', 'Trusted'],
            features: ['Multi-currency', 'Low Cost'],
            link: '#'
        },
        {
            name: 'XE',
            icon: '🌍',
            badges: ['Global', 'Secure'],
            features: ['150+ Countries', 'Reliable'],
            link: '#'
        },
        {
            name: 'OFX',
            icon: '💼',
            badges: ['Premium', 'Trusted'],
            features: ['Large Transfers', 'Expert Support'],
            link: '#'
        }
    ],
    crypto: [
        {
            name: 'Binance',
            icon: '🔶',
            badges: ['High Volume', 'Trusted'],
            features: ['Low Fees', '350+ Coins'],
            link: '#'
        },
        {
            name: 'Coinbase',
            icon: '🔷',
            badges: ['Beginner Friendly', 'Secure'],
            features: ['Easy to Use', 'Insured'],
            link: '#'
        },
        {
            name: 'Kraken',
            icon: '⚡',
            badges: ['Advanced', 'Trusted'],
            features: ['Pro Trading', 'Staking'],
            link: '#'
        },
        {
            name: 'KuCoin',
            icon: '🚀',
            badges: ['Wide Selection', 'Global'],
            features: ['700+ Coins', 'Spot Trading'],
            link: '#'
        }
    ]
};

// Update exchange suggestions based on mode
function updateExchangeSuggestions() {
    const exchangeGrid = document.getElementById('exchange-grid');
    if (!exchangeGrid) return;

    // For cross mode, show crypto platforms since they support crypto-to-fiat
    const platforms = (currentMode === 'fiat') ? exchangePlatforms.fiat : exchangePlatforms.crypto;

    exchangeGrid.innerHTML = platforms.map(platform => `
        <div class="exchange-card">
            <div class="exchange-icon">${platform.icon}</div>
            <h4 class="exchange-name">${platform.name}</h4>
            <div class="exchange-badges">
                ${platform.badges.map(badge =>
        `<span class="badge ${badge.toLowerCase().includes('trust') || badge.toLowerCase().includes('secure') ? 'trust' : ''}">${badge}</span>`
    ).join('')}
            </div>
            <p class="text-sm text-gray-600 mt-2">
                ${platform.features.join(' • ')}
            </p>
            <a href="${platform.link}" class="exchange-link">Visit Platform →</a>
        </div>
    `).join('');
}

// ========== GLOBAL EXPOSURE FOR INLINE EVENT HANDLERS ==========
// Expose functions to window object so inline HTML handlers can access them
window.handleAmountChange = handleAmountChange;
window.handleCurrencyChange = handleCurrencyChange;
window.performConversion = performConversion;
window.switchMode = switchMode;
window.swapCurrenciesRealTime = swapCurrenciesRealTime;
window.changeChartPeriod = changeChartPeriod;
window.appendChartData = appendChartData; // For real-time updates and testing