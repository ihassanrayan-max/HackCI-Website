// ============================================
// Navbar Component
// ============================================
import { icons } from '../assets/icons.js';
import { renderThemeToggle, toggleTheme } from './ThemeToggle.js';
import { isAuthenticated, isAdmin, isAccepted, logout } from '../utils/auth.js';

export function renderNavbar() {
    const authed = isAuthenticated();
    const admin = isAdmin();
    const accepted = isAccepted();
    const currentHash = window.location.hash || '#/';

    const navLinks = [
        { label: 'Home', href: '#/' },
        { label: 'About', href: '#/about' },
        ...(accepted ? [{ label: 'Schedule', href: '#/schedule' }] : []),
        { label: 'FAQ', href: '#/faq' },
    ];

    return `
    <nav class="navbar" id="navbar">
      <div class="navbar__inner container--wide">
        <a href="#/" class="navbar__brand">
          <div class="navbar__logo">
            <svg width="32" height="32" viewBox="0 0 32 32">
              <defs>
                <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#1e90ff"/>
                  <stop offset="100%" style="stop-color:#3ba0ff"/>
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="14" fill="url(#logo-grad)"/>
              <text x="16" y="21" text-anchor="middle" fill="white" font-family="Inter,sans-serif" font-weight="800" font-size="12">CI</text>
            </svg>
          </div>
          <span class="navbar__brand-text">HackCI</span>
        </a>

        <ul class="navbar__links" id="nav-links">
          ${navLinks.map(link => `
            <li>
              <a href="${link.href}" class="navbar__link btn-magnetic ${currentHash === link.href ? 'navbar__link--active' : ''}">
                ${link.label}
              </a>
            </li>
          `).join('')}
        </ul>

        <div class="navbar__actions">
          ${renderThemeToggle()}
          ${authed ? `
            ${admin ? `
              <a href="#/admin" class="btn btn--ghost btn--sm navbar__link navbar__admin-link ${currentHash.startsWith('#/admin') ? 'navbar__link--active' : ''}">
                ${icons.shield} Admin
              </a>
            ` : ''}
            <a href="#/apply" class="btn btn--primary btn--sm ${currentHash === '#/apply' ? 'navbar__link--active' : ''}">
              Apply
            </a>
            ${accepted ? `<a href="#/teams" class="btn btn--ghost btn--sm navbar__link ${currentHash === '#/teams' ? 'navbar__link--active' : ''}">${icons.users} Team Hub</a>` : ''}
            <a href="#/dashboard" class="btn btn--ghost navbar__link ${currentHash === '#/dashboard' ? 'navbar__link--active' : ''}">Dashboard</a>
            <button class="btn btn--secondary btn--sm" id="logout-btn">
              ${icons.logOut} Sign Out
            </button>
          ` : `
            <a href="#/signin" class="btn btn--ghost">Sign In</a>
            <a href="#/signup" class="btn btn--primary btn--sm">Sign Up</a>
          `}
        </div>

        <button class="navbar__hamburger btn btn--icon" id="hamburger-btn" aria-label="Open menu">
          ${icons.menu}
        </button>
      </div>

      <!-- Mobile Menu -->
      <div class="navbar__mobile-menu" id="mobile-menu">
        <div class="navbar__mobile-header">
          <span class="navbar__brand-text">HackCI</span>
          <button class="btn btn--icon" id="close-menu-btn" aria-label="Close menu">
            ${icons.close}
          </button>
        </div>
        <ul class="navbar__mobile-links">
          ${navLinks.map(link => `
            <li>
              <a href="${link.href}" class="navbar__mobile-link ${currentHash === link.href ? 'navbar__link--active' : ''}">
                ${link.label}
              </a>
            </li>
          `).join('')}
          <li class="navbar__mobile-divider"></li>
          ${authed ? `
            <li><a href="#/apply" class="navbar__mobile-link navbar__mobile-link--cta">Apply Now</a></li>
            ${accepted ? '<li><a href="#/teams" class="navbar__mobile-link">Team Hub</a></li>' : ''}
            <li><a href="#/dashboard" class="navbar__mobile-link">Dashboard</a></li>
            <li><a href="#/profile" class="navbar__mobile-link">Profile</a></li>
            ${admin ? `<li><a href="#/admin" class="navbar__mobile-link">Admin Dashboard</a></li>` : ''}
            <li><button class="navbar__mobile-link navbar__mobile-logout" id="mobile-logout-btn">Sign Out</button></li>
          ` : `
            <li><a href="#/signin" class="navbar__mobile-link">Sign In</a></li>
            <li><a href="#/signup" class="navbar__mobile-link navbar__mobile-link--cta">Sign Up</a></li>
          `}
        </ul>
        <div class="navbar__mobile-theme">
          ${renderThemeToggle()}
          <span>Toggle Theme</span>
        </div>
      </div>
      <div class="navbar__overlay" id="nav-overlay"></div>
    </nav>
  `;
}

export function initNavbar() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger-btn');
    const closeBtn = document.getElementById('close-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('nav-overlay');

    // Init Magnetic Buttons for Navbar
    import('../utils/magnetic.js').then(mod => mod.initMagneticButtons());

    // Theme toggle
    document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.addEventListener('click', toggleTheme);
    });

    // Hamburger menu
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            mobileMenu.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    const closeMenu = () => {
        mobileMenu.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

    // Close on nav link click (mobile)
    mobileMenu?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Sticky navbar on scroll
    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        if (navbar) {
            if (currentScroll > 50) {
                navbar.classList.add('navbar--scrolled');
            } else {
                navbar.classList.remove('navbar--scrolled');
            }
        }
    });

    // Logout buttons
    const logoutBtn = document.getElementById('logout-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

    const handleLogout = async () => {
        try {
            await logout();
            window.location.hash = '#/';
        } catch {
            window.location.hash = '#/';
        }
    };

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', () => {
            closeMenu();
            handleLogout();
        });
    }
}
