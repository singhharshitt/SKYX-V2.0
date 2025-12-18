/**
 * Navigation.js - Mobile Menu & Smooth Scrolling
 * Handles all navigation interactions without modifying UI or existing behavior
 */

(function () {
    'use strict';

    // ========== MOBILE MENU TOGGLE ==========

    /**
     * Toggle mobile menu visibility
     * Called by hamburger button onclick handler
     */
    window.toggleMenu = function () {
        const mobileMenu = document.getElementById('mobile-menu');
        const menuBtn = document.getElementById('menu-btn');

        if (!mobileMenu) return;

        const isHidden = mobileMenu.classList.contains('hidden');

        if (isHidden) {
            // Open menu
            mobileMenu.classList.remove('hidden');
            if (menuBtn) {
                menuBtn.setAttribute('aria-expanded', 'true');
            }
        } else {
            // Close menu
            mobileMenu.classList.add('hidden');
            if (menuBtn) {
                menuBtn.setAttribute('aria-expanded', 'false');
            }
        }
    };

    // ========== SMOOTH SCROLLING ==========

    /**
     * Smooth scroll to a target element
     * @param {string} targetId - ID of the element to scroll to
     */
    function smoothScrollTo(targetId) {
        const target = document.getElementById(targetId);

        if (!target) {
            console.warn(`Navigation target not found: #${targetId}`);
            return;
        }

        // Close mobile menu if open
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            toggleMenu();
        }

        // Smooth scroll to target
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    /**
     * Handle anchor link clicks for smooth scrolling
     * @param {Event} e - Click event
     */
    function handleAnchorClick(e) {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');

        // Only handle internal anchor links (starting with #)
        if (!href || !href.startsWith('#')) return;

        // Skip empty anchors
        if (href === '#') return;

        e.preventDefault();

        // Extract section ID (remove the #)
        const targetId = href.substring(1);
        smoothScrollTo(targetId);
    }

    // ========== INITIALIZATION ==========

    document.addEventListener('DOMContentLoaded', function () {

        // Add smooth scrolling to all anchor links
        document.addEventListener('click', handleAnchorClick);

        // Add keyboard support for mobile menu
        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) {
            menuBtn.setAttribute('aria-expanded', 'false');
            menuBtn.setAttribute('aria-label', 'Toggle navigation menu');
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', function (e) {
            const mobileMenu = document.getElementById('mobile-menu');
            const menuBtn = document.getElementById('menu-btn');

            if (!mobileMenu || !menuBtn) return;

            const isMenuOpen = !mobileMenu.classList.contains('hidden');
            const clickedInsideMenu = mobileMenu.contains(e.target);
            const clickedMenuButton = menuBtn.contains(e.target);

            // Close if clicking outside while open
            if (isMenuOpen && !clickedInsideMenu && !clickedMenuButton) {
                toggleMenu();
            }
        });

        // Close mobile menu on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                    toggleMenu();
                }
            }
        });

        console.log('[Navigation] Initialized - Mobile menu and smooth scrolling active');
    });

})();
