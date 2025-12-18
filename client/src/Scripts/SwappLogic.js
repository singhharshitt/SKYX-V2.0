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

// Crypto ID mappings for CoinGecko API
const cryptoIds = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'XRP': 'ripple',
    'SOL': 'solana',
    'ADA': 'cardano',
    'USDT': 'tether',
    'USDC': 'usd-coin',
    'DOGE': 'dogecoin',
    'AVAX': 'avalanche-2',
    'DOT': 'polkadot',
    'MATIC': 'matic-network',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'LTC': 'litecoin'
};

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

    // Update exchange suggestions
    updateExchangeSuggestions();
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
        let rate;

        if (currentMode === 'fiat') {
            // Fiat conversion using exchangerate API
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
            const data = await response.json();
            rate = data.rates[toCurrency];
        } else if (currentMode === 'crypto') {
            // Crypto conversion using CoinGecko API
            const fromId = cryptoIds[fromCurrency];
            const toId = cryptoIds[toCurrency];

            if (fromId && toId) {
                const response = await fetch(
                    `https://api.coingecko.com/api/v3/simple/price?ids=${fromId}&vs_currencies=${toId}`
                );
                const data = await response.json();
                rate = data[fromId]?.[toId.toLowerCase()] || 1;
            } else {
                rate = 1;
            }
        } else if (currentMode === 'cross') {
            // Cross-mode: Crypto to Fiat conversion
            const fromId = cryptoIds[fromCurrency];

            if (fromId) {
                const response = await fetch(
                    `https://api.coingecko.com/api/v3/simple/price?ids=${fromId}&vs_currencies=${toCurrency.toLowerCase()}`
                );
                const data = await response.json();
                rate = data[fromId]?.[toCurrency.toLowerCase()];

                if (!rate) {
                    throw new Error('Unable to fetch conversion rate');
                }
            } else {
                throw new Error('Invalid cryptocurrency');
            }
        }

        // Calculate result
        const result = parseFloat(fromAmount) * rate;

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

    if (!fromCurrencySelect || !toCurrencySelect) return;

    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;

    const placeholder = document.getElementById('chart-placeholder-premium');
    const chartCanvas = document.getElementById('liveChart');

    if (!placeholder || !chartCanvas) return;

    try {
        let chartData;

        if (currentMode === 'crypto') {
            // Fetch crypto historical data from CoinGecko
            const days = currentPeriod === '7d' ? 7 : currentPeriod === '30d' ? 30 : 90;
            const fromId = cryptoIds[fromCurrency];

            if (fromId) {
                const response = await fetch(
                    `https://api.coingecko.com/api/v3/coins/${fromId}/market_chart?vs_currency=usd&days=${days}`
                );
                const data = await response.json();

                chartData = {
                    labels: data.prices.map((_, i) => `Day ${i + 1}`),
                    values: data.prices.map(p => p[1])
                };
            } else {
                throw new Error('Invalid cryptocurrency');
            }
        } else {
            // For fiat, generate sample data (real API would require paid service)
            const days = currentPeriod === '7d' ? 7 : currentPeriod === '30d' ? 30 : 90;
            const baseValue = 1.0;
            chartData = {
                labels: Array.from({ length: days }, (_, i) => `Day ${i + 1}`),
                values: Array.from({ length: days }, () =>
                    baseValue + (Math.random() - 0.5) * 0.1)
            };
        }

        // Hide placeholder, show chart
        placeholder.classList.add('hidden');
        chartCanvas.classList.remove('hidden');

        renderChart(chartData);

    } catch (error) {
        console.error('Chart error:', error);
        // Show placeholder on error
        placeholder.classList.remove('hidden');
        chartCanvas.classList.add('hidden');
    }
}

// Render chart using Chart.js
function renderChart(data) {
    const ctx = document.getElementById('liveChart').getContext('2d');

    if (priceChart) {
        priceChart.destroy();
    }

    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Price History',
                data: data.values,
                borderColor: '#FF6F00',
                backgroundColor: 'rgba(255, 111, 0, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#FF6F00'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#FF6F00',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        color: '#757575'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Change chart period
function changeChartPeriod(period) {
    currentPeriod = period;

    // Update button styles
    const chartBtns = document.querySelectorAll('.premium-chart-btn');
    chartBtns.forEach(btn => {
        if (btn.dataset.period === period) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    updateChart();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    updateCurrencyLists();

    // Hide chart initially
    const chartCanvas = document.getElementById('liveChart');
    if (chartCanvas) {
        chartCanvas.classList.add('hidden');
    }

    // Initialize exchange suggestions
    updateExchangeSuggestions();
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