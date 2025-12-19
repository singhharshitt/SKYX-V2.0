// Import Three.js as ES module (eliminates deprecation warnings)
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.getElementById("globeCanvas");

// Safety check: only initialize globe if canvas exists
if (canvas) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);

    // Load Earth texture with proper CORS handling
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';
    const earthTexture = textureLoader.load("/assets/skin3.png");

    // Sphere (Earth) - higher detail for smoothness
    const geometry = new THREE.SphereGeometry(2, 128, 128);
    const material = new THREE.MeshStandardMaterial({
        map: earthTexture,
        roughness: 1,
        metalness: 0,
    });
    const globe = new THREE.Mesh(geometry, material);

    // Tilt Earth a bit (about 23.5 degrees)
    globe.rotation.z = THREE.MathUtils.degToRad(23.5);

    scene.add(globe);

    // Lights
    const light = new THREE.PointLight(0xffffff, 2.0);
    light.position.set(5, 3, 5);
    scene.add(light);

    const ambient = new THREE.AmbientLight(0x606060, 2.0);
    scene.add(ambient);

    camera.position.z = 5;

    // ✅ Resize handler to keep canvas responsive
    function resizeRenderer() {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    // Run once at start
    resizeRenderer();

    // Update when window resizes
    window.addEventListener("resize", resizeRenderer);

    // Animate spin
    function animate() {
        requestAnimationFrame(animate);
        globe.rotation.y += 0.002; // spin around vertical axis
        renderer.render(scene, camera);
    }
    animate();
}

// Currency Converter JavaScript
class CurrencyConverter {
    constructor() {
        this.apiBaseUrl = window.API_CONFIG?.API_BASE_URL || (() => { throw new Error('API configuration not loaded'); })();
        this.currentMode = 'fiat'; // 'fiat' or 'crypto'
        this.fiatCurrencies = [];
        this.cryptoCurrencies = [];
        this.chart = null;

        const initialized = this.initializeElements();

        if (!initialized) {
            console.log('CurrencyConverter: Not initializing on this page (missing required elements)');
            return;
        }

        this.loadCurrencies();
        this.setupEventListeners();
    }

    initializeElements() {
        this.elements = {
            fiatToggle: document.getElementById('fiatToggle'),
            cryptoToggle: document.getElementById('cryptoToggle'),
            fromAmount: document.getElementById('fromAmount'),
            toAmount: document.getElementById('toAmount'),
            fromCurrency: document.getElementById('fromCurrency'),
            toCurrency: document.getElementById('toCurrency'),
            conversionForm: document.getElementById('conversionForm'),
            swapCurrencies: document.getElementById('swapCurrencies'),
            conversionResult: document.getElementById('conversionResult'),
            conversionText: document.getElementById('conversionText'),
            rateText: document.getElementById('rateText'),
            timestampText: document.getElementById('timestampText'),
            exchangeSuggestions: document.getElementById('exchangeSuggestions'),
            chartInfo: document.getElementById('chartInfo')
        };

        // Check if required elements exist
        const requiredElements = ['fromCurrency', 'toCurrency'];
        const missingElements = requiredElements.filter(key => !this.elements[key]);

        if (missingElements.length > 0) {
            console.warn('CurrencyConverter: Required elements not found on this page. Skipping initialization.');
            this.isInitialized = false;
            return false;
        }

        this.isInitialized = true;
        return true;
    }

    async loadCurrencies() {
        try {
            // Load fiat currencies
            const fiatResponse = await fetch(`${this.apiBaseUrl}/currencies/fiat`);
            const fiatData = await fiatResponse.json();

            // Parse new backend format { success: true, data: [...], source: "..." }
            this.fiatCurrencies = fiatData.success ? fiatData.data : [];

            // Load crypto currencies
            const cryptoResponse = await fetch(`${this.apiBaseUrl}/currencies/crypto`);
            const cryptoData = await cryptoResponse.json();

            // Parse Binance format: { symbol: "BTC", name: "BTC", tradingSymbol: "BTCUSDT" }
            // Map to expected format: { code: "BTC", name: "BTC" }
            this.cryptoCurrencies = cryptoData.success
                ? cryptoData.data.map(coin => ({
                    code: coin.symbol,
                    name: coin.name || coin.symbol,
                    symbol: coin.symbol // Use symbol as fallback
                }))
                : [];

            this.populateCurrencyDropdowns();
        } catch (error) {
            console.error('Error loading currencies:', error);
            this.showError('Failed to load currency data');
        }
    }

    populateCurrencyDropdowns() {
        if (!this.isInitialized || !this.elements.fromCurrency || !this.elements.toCurrency) return;

        const currencies = this.currentMode === 'fiat' ? this.fiatCurrencies : this.cryptoCurrencies;

        // Clear existing options
        this.elements.fromCurrency.innerHTML = '<option value="">Select</option>';
        this.elements.toCurrency.innerHTML = '<option value="">Select</option>';

        // Populate dropdowns
        currencies.forEach(currency => {
            const option1 = new Option(`${currency.code} - ${currency.name}`, currency.code);
            const option2 = new Option(`${currency.code} - ${currency.name}`, currency.code);

            this.elements.fromCurrency.add(option1);
            this.elements.toCurrency.add(option2);
        });

        // Set default values
        if (this.currentMode === 'fiat') {
            this.elements.fromCurrency.value = 'USD';
            this.elements.toCurrency.value = 'EUR';
        } else {
            this.elements.fromCurrency.value = 'BTC';
            this.elements.toCurrency.value = 'ETH';
        }
    }

    setupEventListeners() {
        if (!this.isInitialized) return;

        // Toggle buttons
        if (this.elements.fiatToggle) {
            this.elements.fiatToggle.addEventListener('click', () => this.switchMode('fiat'));
        }
        if (this.elements.cryptoToggle) {
            this.elements.cryptoToggle.addEventListener('click', () => this.switchMode('crypto'));
        }

        // Form submission
        this.elements.conversionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.performConversion();
        });

        // Swap currencies
        this.elements.swapCurrencies.addEventListener('click', () => this.swapCurrencies());

        // Real-time conversion on input change
        this.elements.fromAmount.addEventListener('input', () => this.debounceConversion());
        this.elements.fromCurrency.addEventListener('change', () => this.debounceConversion());
        this.elements.toCurrency.addEventListener('change', () => this.debounceConversion());
    }

    switchMode(mode) {
        this.currentMode = mode;

        // Update toggle buttons
        if (mode === 'fiat') {
            this.elements.fiatToggle.classList.add('bg-white', 'shadow-sm', 'text-gray-900');
            this.elements.fiatToggle.classList.remove('text-gray-600');
            this.elements.cryptoToggle.classList.remove('bg-white', 'shadow-sm', 'text-gray-900');
            this.elements.cryptoToggle.classList.add('text-gray-600');
        } else {
            this.elements.cryptoToggle.classList.add('bg-white', 'shadow-sm', 'text-gray-900');
            this.elements.cryptoToggle.classList.remove('text-gray-600');
            this.elements.fiatToggle.classList.remove('bg-white', 'shadow-sm', 'text-gray-900');
            this.elements.fiatToggle.classList.add('text-gray-600');
        }

        // Clear form
        this.elements.fromAmount.value = '';
        this.elements.toAmount.value = '';
        this.hideResults();

        // Repopulate dropdowns
        this.populateCurrencyDropdowns();
    }

    swapCurrencies() {
        const fromValue = this.elements.fromCurrency.value;
        const toValue = this.elements.toCurrency.value;

        this.elements.fromCurrency.value = toValue;
        this.elements.toCurrency.value = fromValue;

        // Trigger conversion if amount is entered
        if (this.elements.fromAmount.value) {
            this.performConversion();
        }
    }

    debounceConversion() {
        clearTimeout(this.conversionTimeout);
        this.conversionTimeout = setTimeout(() => {
            if (this.elements.fromAmount.value && this.elements.fromCurrency.value && this.elements.toCurrency.value) {
                this.performConversion();
            }
        }, 500);
    }

    async performConversion() {
        const fromCurrency = this.elements.fromCurrency.value;
        const toCurrency = this.elements.toCurrency.value;
        const amount = parseFloat(this.elements.fromAmount.value);

        if (!fromCurrency || !toCurrency || !amount || amount <= 0) {
            this.hideResults();
            return;
        }

        if (fromCurrency === toCurrency) {
            this.showError('Please select different currencies');
            return;
        }

        try {
            this.showLoading();

            let endpoint;
            if (this.currentMode === 'fiat') {
                endpoint = `${this.apiBaseUrl}/convert/fiat?from=${fromCurrency}&to=${toCurrency}&amount=${amount}`;
            } else {
                endpoint = `${this.apiBaseUrl}/convert/crypto?from=${fromCurrency}&to=${toCurrency}&amount=${amount}`;
            }

            const response = await fetch(endpoint);
            const responseData = await response.json();

            if (response.ok && responseData.success) {
                // Normalize data structure for display
                const normalizedData = {
                    from: responseData.data.from,
                    to: responseData.data.to,
                    amount: responseData.data.amount,
                    convertedAmount: responseData.data.result, // Backend uses 'result'
                    rate: responseData.data.rate,
                    timestamp: responseData.data.timestamp
                };

                this.displayConversionResult(normalizedData);
                this.updateChart(fromCurrency, toCurrency);
            } else {
                this.showError(responseData.message || 'Conversion failed');
            }
        } catch (error) {
            console.error('Conversion error:', error);
            this.showError('Failed to perform conversion');
        }
    }

    displayConversionResult(data) {
        const fromSymbol = this.getCurrencySymbol(data.from);
        const toSymbol = this.getCurrencySymbol(data.to);

        this.elements.toAmount.value = data.convertedAmount.toFixed(8);

        this.elements.conversionText.textContent =
            `${fromSymbol}${data.amount.toLocaleString()} ${data.from} = ${toSymbol}${data.convertedAmount.toLocaleString()} ${data.to}`;

        this.elements.rateText.textContent =
            `1 ${data.from} = ${data.rate.toFixed(8)} ${data.to}`;

        this.elements.timestampText.textContent =
            `Last updated: ${new Date(data.timestamp).toLocaleString()}`;

        this.elements.conversionResult.classList.remove('hidden');
        this.elements.exchangeSuggestions.classList.remove('hidden');
    }

    getCurrencySymbol(code) {
        // Simple mapping for common currency symbols
        const symbolMap = {
            'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'INR': '₹',
            'BTC': '₿', 'ETH': 'Ξ', 'BNB': 'BNB', 'XRP': 'XRP'
        };
        return symbolMap[code] || '';
    }

    async updateChart(fromCurrency, toCurrency) {
        try {
            const response = await fetch(
                `${this.apiBaseUrl}/rates/history?from=${fromCurrency}&to=${toCurrency}&days=7`
            );
            const responseData = await response.json();

            if (responseData.success && responseData.data.prices && responseData.data.prices.length > 0) {
                this.createChart(responseData.data.prices, fromCurrency, toCurrency);
            } else {
                this.elements.chartInfo.textContent = 'Chart data not available for this pair';
            }
        } catch (error) {
            console.error('Chart update error:', error);
            this.elements.chartInfo.textContent = 'Unable to load chart data';
        }
    }

    createChart(data, fromCurrency, toCurrency) {
        const chartCanvas = document.getElementById('priceChart');
        if (!chartCanvas) return;
        
        const ctx = chartCanvas.getContext('2d', { 
            alpha: true,
            desynchronized: false 
        });

        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }

        const labels = data.map(item => new Date(item.timestamp).toLocaleDateString());
        const prices = data.map(item => item.price);

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${fromCurrency} to ${toCurrency}`,
                    data: prices,
                    borderColor: '#f97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.15)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.5,
                    pointBackgroundColor: '#f97316',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#f97316',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
                        borderColor: '#f97316',
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
                            label: function(context) {
                                return `${context.parsed.y.toFixed(6)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        position: 'right',
                        grid: {
                            color: 'rgba(255, 255, 255, 0.08)',
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
                            callback: function(value) {
                                return value.toFixed(4);
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.08)',
                            lineWidth: 1,
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            font: {
                                size: 10,
                                weight: '500'
                            },
                            padding: 6,
                            maxRotation: 45,
                            minRotation: 0
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
                    },
                    point: {
                        hoverRadius: 8
                    }
                }
            }
        });

        this.elements.chartInfo.textContent = `7-day price history for ${fromCurrency}/${toCurrency}`;
    }

    showLoading() {
        this.elements.conversionResult.classList.add('hidden');
        this.elements.exchangeSuggestions.classList.add('hidden');
        this.elements.chartInfo.textContent = 'Loading...';
    }

    hideResults() {
        this.elements.conversionResult.classList.add('hidden');
        this.elements.exchangeSuggestions.classList.add('hidden');
        this.elements.toAmount.value = '';
        this.elements.chartInfo.textContent = 'Select currencies to view price history';
    }

    showError(message) {
        if (!this.isInitialized) {
            console.error('CurrencyConverter Error:', message);
            return;
        }
        if (this.elements.conversionText) {
            this.elements.conversionText.textContent = message;
        }
        this.elements.rateText.textContent = '';
        this.elements.timestampText.textContent = '';
        this.elements.conversionResult.classList.remove('hidden');
        this.elements.exchangeSuggestions.classList.add('hidden');
    }
}

// Initialize the converter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CurrencyConverter();
});