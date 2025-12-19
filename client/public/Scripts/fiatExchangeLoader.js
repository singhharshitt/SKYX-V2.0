/**
 * Fiat Exchange Provider Loader
 * Fetches real-time fiat exchange provider recommendations and injects into DOM
 * Preserves all existing UI, animations, and Tailwind classes
 */

(function () {
    'use strict';

    // Configuration
    const API_ENDPOINT = window.location.hostname === 'localhost'
        ? 'http://localhost:3001/api/fiat-exchanges/recommendations'
        : 'https://skyx-v2-0.onrender.com/api/fiat-exchanges/recommendations';

    const REFRESH_INTERVAL = 120000; // 120 seconds (2 minutes)
    const RETRY_DELAY = 5000; // 5 seconds on error

    // Default currency pair (can be made dynamic later)
    const DEFAULT_BASE = 'USD';
    const DEFAULT_TARGET = 'EUR';

    // Fallback static data
    const FALLBACK_DATA = [
        {
            name: 'Wise',
            logo: 'https://wise.com/public-resources/assets/logos/wise/brand_logo.svg',
            rate: 0,
            fees: 'Low',
            speed: 'Fast',
            availability: 'Global',
            bestFor: ['Low fees', 'International transfers'],
            score: 94
        },
        {
            name: 'Revolut',
            logo: 'https://assets.revolut.com/media/logo/logo-revolut.svg',
            rate: 0,
            fees: 'Low',
            speed: 'Instant',
            availability: 'Europe & US',
            bestFor: ['Speed', 'Multi-currency accounts'],
            score: 92
        },
        {
            name: 'XE Money Transfer',
            logo: 'https://www.xe.com/themes/xe/images/logos/xe-logo.svg',
            rate: 0,
            fees: 'Low',
            speed: 'Medium',
            availability: 'Global',
            bestFor: ['Large transfers', 'No fees'],
            score: 88
        }
    ];

    /**
     * Create fiat provider card HTML
     */
    function createProviderCard(provider, base, target) {
        const bestForTags = provider.bestFor.slice(0, 2).map(tag =>
            `<span class="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">${tag}</span>`
        ).join('');

        const rateDisplay = provider.rate > 0
            ? `<div class="text-sm text-gray-300">1 ${base} = <span class="text-white font-semibold">${provider.rate.toFixed(4)} ${target}</span></div>`
            : '';

        return `
            <div class="exchange-card p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-blue-500/30 transition-all duration-300 hover:transform hover:-translate-y-1">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <img 
                            src="${provider.logo}" 
                            alt="${provider.name}" 
                            class="w-12 h-12 rounded-lg object-contain bg-white/10 p-2"
                            loading="lazy"
                            onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22%3E%3Crect fill=%22%23374151%22 width=%2248%22 height=%2248%22/%3E%3C/svg%3E'"
                        />
                        <div>
                            <h4 class="text-lg font-bold text-white lexend-exa-semibold">${provider.name}</h4>
                            ${rateDisplay}
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-blue-400 lexend-exa-bold">${provider.score}</div>
                        <div class="text-xs text-gray-400">Score</div>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-3 mb-4">
                    <div class="bg-white/5 p-2 rounded-lg">
                        <div class="text-xs text-gray-400 mb-1">Fees</div>
                        <div class="text-sm font-semibold text-white">${provider.fees}</div>
                    </div>
                    <div class="bg-white/5 p-2 rounded-lg">
                        <div class="text-xs text-gray-400 mb-1">Speed</div>
                        <div class="text-sm font-semibold text-white">${provider.speed}</div>
                    </div>
                    <div class="bg-white/5 p-2 rounded-lg col-span-2">
                        <div class="text-xs text-gray-400 mb-1">Availability</div>
                        <div class="text-sm font-semibold text-white">${provider.availability}</div>
                    </div>
                </div>
                
                <div class="flex gap-2 flex-wrap">
                    ${bestForTags}
                </div>
            </div>
        `;
    }

    /**
     * Render providers into DOM
     */
    function renderProviders(providers, base, target) {
        const container = document.getElementById('fiat-exchange-grid');
        if (!container) {
            console.error('[FiatExchangeLoader] Container #fiat-exchange-grid not found');
            return;
        }

        const html = providers.map(provider => createProviderCard(provider, base, target)).join('');
        container.innerHTML = html;
    }

    /**
     * Fetch fiat provider data from backend
     */
    async function fetchProviderData(base = DEFAULT_BASE, target = DEFAULT_TARGET) {
        try {
            const response = await fetch(`${API_ENDPOINT}?base=${base}&target=${target}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.providers && data.providers.length > 0) {
                console.log('[FiatExchangeLoader] Loaded provider data:', data.source || 'live');
                renderProviders(data.providers, data.base, data.target);
                return true;
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.warn('[FiatExchangeLoader] API error:', error.message, '- Using fallback data');
            renderProviders(FALLBACK_DATA, base, target);
            return false;
        }
    }

    /**
     * Initialize and start auto-refresh
     */
    function init() {
        console.log('[FiatExchangeLoader] Initializing...');

        // Initial load
        fetchProviderData().then(success => {
            if (success) {
                // Auto-refresh every 120 seconds
                setInterval(() => {
                    console.log('[FiatExchangeLoader] Auto-refreshing...');
                    fetchProviderData();
                }, REFRESH_INTERVAL);
            } else {
                // Retry failed load after delay
                setTimeout(() => {
                    console.log('[FiatExchangeLoader] Retrying...');
                    fetchProviderData();
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
