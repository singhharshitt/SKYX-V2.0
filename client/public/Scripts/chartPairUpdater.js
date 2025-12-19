/**
 * Chart Currency Pair Updater
 * Dynamically updates the chart subtitle to show active conversion pair
 */

(function () {
    'use strict';

    let isInitialized = false;

    /**
     * Update chart subtitle with current currency pair
     */
    function updateChartPair() {
        const fromCurrency = document.getElementById('from-currency-select');
        const toCurrency = document.getElementById('to-currency-select');
        const chartPairElement = document.getElementById('chart-currency-pair');

        if (!chartPairElement) {
            console.warn('[ChartPairUpdater] chart-currency-pair element not found');
            return;
        }

        if (!fromCurrency || !toCurrency) {
            console.warn('[ChartPairUpdater] Currency selects not found');
            return;
        }

        const from = fromCurrency.value || 'USD';
        const to = toCurrency.value || 'EUR';

        chartPairElement.textContent = `${from} / ${to}`;
        console.log('[ChartPairUpdater] Updated chart pair to:', `${from} / ${to}`);
    }

    /**
     * Setup currency change listeners
     */
    function setupListeners() {
        const fromCurrency = document.getElementById('from-currency-select');
        const toCurrency = document.getElementById('to-currency-select');

        if (fromCurrency && toCurrency) {
            fromCurrency.addEventListener('change', updateChartPair);
            toCurrency.addEventListener('change', updateChartPair);

            console.log('[ChartPairUpdater] Listeners attached successfully');
            isInitialized = true;
        } else {
            console.warn('[ChartPairUpdater] Could not attach listeners - selects not found');
        }
    }

    /**
     * Initialize with retry mechanism
     */
    function init() {
        console.log('[ChartPairUpdater] Initializing...');

        // Try to update immediately
        updateChartPair();

        // Setup listeners
        setupListeners();

        // If not initialized, retry after delay
        if (!isInitialized) {
            setTimeout(() => {
                console.log('[ChartPairUpdater] Retrying initialization...');
                init();
            }, 1000);
        }
    }

    // Execute immediately and on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already loaded, run immediately
        init();
    }

    // Also try after a short delay to ensure all elements are ready
    setTimeout(init, 500);

})();
