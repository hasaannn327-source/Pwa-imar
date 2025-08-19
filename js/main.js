// Entry point (placeholder for future modularization)
// Currently, the app still uses app.js. This module is prepared for
// progressive refactor to ES modules.

import '../app.js';

import { initializeApp } from './ui.js';
import { setupEventListeners } from './events.js';
import { selectDefaultApartments } from './ui.js';
import { registerPWA } from './pwa.js';
import { setupTheme } from './theme.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    selectDefaultApartments();
    registerPWA();
    setupTheme();
});

