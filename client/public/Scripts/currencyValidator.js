/**
 * Currency Selection Validator
 * Prevents selecting the same currency in FROM and TO dropdowns
 * Auto-switches TO currency if it matches FROM (and vice versa)
 */

(function () {
    'use strict';

    /**
     * Prevent same currency selection by auto-switching
     */
    function validateCurrencySelection() {
        const fromSelect = document.getElementById('from-currency-select');
        const toSelect = document.getElementById('to-currency-select');

        if (!fromSelect || !toSelect) {
            console.warn('[CurrencyValidator] Currency selects not found');
            return;
        }

        const fromValue = fromSelect.value;
        const toValue = toSelect.value;

        // If same currency selected, find an alternative
        if (fromValue === toValue) {
            console.log('[CurrencyValidator] Same currency detected:', fromValue);

            // Get all options from the dropdown that was NOT just changed
            const sourceSelect = document.activeElement === fromSelect ? toSelect : fromSelect;
            const options = Array.from(sourceSelect.options);

            // Find first option that's different from the conflicting value
            const alternativeOption = options.find(opt => opt.value !== fromValue && opt.value !== '');

            if (alternativeOption) {
                sourceSelect.value = alternativeOption.value;
                console.log('[CurrencyValidator] Auto-switched to:', alternativeOption.value);

                // Trigger change event to update conversion
                const changeEvent = new Event('change', { bubbles: true });
                sourceSelect.dispatchEvent(changeEvent);
            }
        }
    }

    /**
     * Setup validation listeners
     */
    function setupValidation() {
        const fromSelect = document.getElementById('from-currency-select');
        const toSelect = document.getElementById('to-currency-select');

        if (fromSelect && toSelect) {
            // Validate on change
            fromSelect.addEventListener('change', validateCurrencySelection);
            toSelect.addEventListener('change', validateCurrencySelection);

            // Also validate on initial load
            validateCurrencySelection();

            console.log('[CurrencyValidator] Validation active');
        } else {
            // Retry after delay
            setTimeout(setupValidation, 500);
        }
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupValidation);
    } else {
        setupValidation();
    }

})();
