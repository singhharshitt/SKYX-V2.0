// API Configuration - Environment-aware
// This file must be loaded BEFORE other scripts
(function () {
    // Get backend URL from Vite-injected environment variable or use localhost
    const backendUrl = typeof import.meta !== 'undefined' && import.meta.env
        ? (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001')
        : 'http://localhost:3001';

    // Expose as global variable
    window.API_CONFIG = {
        BACKEND_URL: backendUrl,
        API_BASE_URL: `${backendUrl}/api`
    };

    console.log('[API Config] Backend URL:', window.API_CONFIG.BACKEND_URL);
})();
