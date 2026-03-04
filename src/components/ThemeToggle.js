// ============================================
// Theme Toggle Component
// ============================================
import { icons } from '../assets/icons.js';

export function initTheme() {
    const saved = localStorage.getItem('hackci-theme');
    const theme = saved || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
}

export function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('hackci-theme', next);

    // Update toggle button icon
    const btn = document.querySelector('.theme-toggle');
    if (btn) {
        btn.innerHTML = next === 'dark' ? icons.sun : icons.moon;
        btn.setAttribute('aria-label', `Switch to ${next === 'dark' ? 'light' : 'dark'} mode`);
    }
}

export function renderThemeToggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    return `
    <button class="btn btn--icon theme-toggle" 
            aria-label="Switch to ${current === 'dark' ? 'light' : 'dark'} mode">
      ${current === 'dark' ? icons.sun : icons.moon}
    </button>
  `;
}
