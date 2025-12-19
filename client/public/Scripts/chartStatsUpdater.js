/**
 * Chart Stats Updater
 * Updates the chart statistics display with current conversion rates
 */

(function () {
    'use strict';

    /**
     * Update chart stats with current rate data
     */
    function updateChartStats() {
        const fromAmount = document.getElementById('from-amount');
        const toAmount = document.getElementById('to-amount');
        const fromCurrency = document.getElementById('from-currency-select');
        const toCurrency = document.getElementById('to-currency-select');

        const currentRateDisplay = document.getElementById('current-rate-display');
        const rateChange = document.getElementById('rate-change');
        const high24h = document.getElementById('high-24h');
        const low24h = document.getElementById('low-24h');

        if (!currentRateDisplay || !fromAmount || !toAmount || !fromCurrency || !toCurrency) {
            return;
        }

        const from = parseFloat(fromAmount.value) || 1;
        const to = parseFloat(toAmount.value) || 0;

        if (from > 0 && to > 0) {
            const rate = to / from;
            const fromCurr = fromCurrency.value || 'USD';
            const toCurr = toCurrency.value || 'EUR';

            // Update current rate
            currentRateDisplay.textContent = `${rate.toFixed(6)} ${toCurr}`;

            // Estimate 24h high/low (±2% of current rate)
            const highValue = rate * 1.02;
            const lowValue = rate * 0.98;

            if (high24h) {
                high24h.textContent = `${highValue.toFixed(6)} ${toCurr}`;
            }

            if (low24h) {
                low24h.textContent = `${lowValue.toFixed(6)} ${toCurr}`;
            }

            // Random change simulation (replace with real API data if available)
            const change = (Math.random() * 2 - 1).toFixed(2); // -1% to +1%
            if (rateChange) {
                rateChange.textContent = `${change > 0 ? '+' : ''}${change}%`;
                rateChange.className = `stat-change ${change >= 0 ? 'positive' : 'negative'}`;
            }
        } else {
            // No conversion active - show defaults
            currentRateDisplay.textContent = '--';
            if (high24h) high24h.textContent = '--';
            if (low24h) low24h.textContent = '--';
            if (rateChange) {
                rateChange.textContent = '+0.00%';
                rateChange.className = 'stat-change positive';
            }
        }
    }

    /**
     * Setup listeners
     */
    function setupListeners() {
        const fromAmount = document.getElementById('from-amount');
        const toAmount = document.getElementById('to-amount');
        const fromCurrency = document.getElementById('from-currency-select');
        const toCurrency = document.getElementById('to-currency-select');

        if (fromAmount && toAmount && fromCurrency && toCurrency) {
            fromAmount.addEventListener('input', updateChartStats);
            toAmount.addEventListener('input', updateChartStats);
            fromCurrency.addEventListener('change', updateChartStats);
            toCurrency.addEventListener('change', updateChartStats);

            console.log('[ChartStatsUpdater] Listeners attached');
        }
    }

    /**
     * Initialize
     */
    function init() {
        updateChartStats();
        setupListeners();
    }

    // Execute on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Also try after delay
    setTimeout(init, 500);

})();
