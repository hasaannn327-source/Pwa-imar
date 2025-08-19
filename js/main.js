import { initializeApp, selectDefaultApartments } from './ui.js';
import { setupEventListeners } from './events.js';
import { registerPWA } from './pwa.js';
import { setupTheme } from './theme.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    selectDefaultApartments();
    registerPWA();
    setupTheme();
});

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

