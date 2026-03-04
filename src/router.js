import { renderNavbar } from './components/Navbar.js';
import { renderFooter } from './components/Footer.js';
import { resolveSession, isAuthenticated, isAdmin, isAccepted, ensureProfile, getUser } from './utils/auth.js';
import { showToast } from './utils/toast.js';
import { updateSEO } from './utils/seo.js';
import { renderLoadingSpinner } from './components/LoadingSpinner.js';

// Page Imports
import { renderLanding, initLanding } from './pages/Landing.js';
import { renderAbout, initAbout } from './pages/About.js';
import { renderSchedule, initSchedule } from './pages/Schedule.js';
import { renderFAQ, initFAQ } from './pages/FAQ.js';
import { renderSignIn, initSignIn } from './pages/SignIn.js';
import { renderSignUp, initSignUp } from './pages/SignUp.js';
import { renderDashboard, initDashboard } from './pages/Dashboard.js';
import { renderProfile, initProfile } from './pages/Profile.js';
import { renderNotFound, initNotFound } from './pages/NotFound.js';
import { renderApply, initApply } from './pages/Apply.js';
import { renderAdminDashboard, initAdminDashboard } from './pages/AdminDashboard.js';
import { renderAdminApplication, initAdminApplication } from './pages/AdminApplication.js';
import { renderTeamHub, initTeamHub } from './pages/TeamHub.js';
import { renderAdminTeams, initAdminTeams } from './pages/AdminTeams.js';

// Legal Pages
import { renderPrivacyPolicy } from './pages/legal/PrivacyPolicy.js';
import { renderCodeOfConduct } from './pages/legal/CodeOfConduct.js';

const routes = {
    '#/': { render: renderLanding, init: initLanding, title: 'Build the Future', auth: false },
    '#/about': { render: renderAbout, init: initAbout, title: 'About', auth: false },
    '#/schedule': { render: renderSchedule, init: initSchedule, title: 'Schedule', auth: true, acceptedOnly: true },
    '#/faq': { render: renderFAQ, init: initFAQ, title: 'FAQ', auth: false },

    // Auth
    '#/signin': { render: renderSignIn, init: initSignIn, title: 'Sign In', guestOnly: true },
    '#/signup': { render: renderSignUp, init: initSignUp, title: 'Sign Up', guestOnly: true },

    // Authenticated
    '#/dashboard': { render: renderDashboard, init: initDashboard, title: 'Dashboard', auth: true },
    '#/profile': { render: renderProfile, init: initProfile, title: 'Your Profile', auth: true },
    '#/apply': { render: renderApply, init: initApply, title: 'Apply', auth: true },
    '#/teams': { render: renderTeamHub, init: initTeamHub, title: 'Team Hub', auth: true, acceptedOnly: true },

    // Admin (auth + adminOnly)
    '#/admin': { render: renderAdminDashboard, init: initAdminDashboard, title: 'Admin Dashboard', auth: true, adminOnly: true },
    '#/admin/teams': { render: renderAdminTeams, init: initAdminTeams, title: 'Admin — Teams', auth: true, adminOnly: true },

    // Legal
    '#/privacy': { render: renderPrivacyPolicy, title: 'Privacy Policy', auth: false },
    '#/code-of-conduct': { render: renderCodeOfConduct, title: 'Code of Conduct', auth: false },

    // 404
    '404': { render: renderNotFound, init: initNotFound, title: 'Page Not Found', auth: false },
};

// Admin application detail — matched by pattern
const ADMIN_APP_PATTERN = /^#\/admin\/application\/[^?#]+$/;

export function initRouter() {
    const app = document.getElementById('app');

    const router = async () => {
        // ── OAuth callback: Supabase returns #access_token=... after Google sign-in ──
        const rawHash = window.location.hash;
        if (rawHash.includes('access_token=') || rawHash.startsWith('#error_description')) {
            // Supabase SDK auto-processes the session tokens from the URL fragment.
            // Ensure profile exists (Google edge case: trigger may not have name yet).
            await ensureProfile();
            // Wipe the token fragment from the URL bar before routing
            history.replaceState(null, '', window.location.pathname);
            const user = getUser();
            if (!user) {
                showToast('Sign-in failed. Please try again.', 'error');
                window.location.hash = '#/signin';
            } else if (!user.first_name || !user.last_name) {
                showToast('Welcome! Please complete your profile.', 'info');
                window.location.hash = '#/profile';
            } else if (isAdmin()) {
                window.location.hash = '#/admin';
            } else {
                window.location.hash = '#/dashboard';
            }
            return;
        }

        let hash = (window.location.hash || '#/').split('?')[0];

        // Match admin application detail route by pattern
        let route;
        let isAdminAppDetail = false;

        if (ADMIN_APP_PATTERN.test(hash)) {
            route = {
                render: renderAdminApplication,
                init: initAdminApplication,
                title: 'Application Review',
                auth: true,
                adminOnly: true,
            };
            isAdminAppDetail = true;
        } else {
            route = routes[hash] || routes['404'];
        }

        // ── Resolve auth state ──────────────────────────────────────────────
        // Show a quick loading state while resolving (avoids flicker on page load)
        const loadingBar = document.getElementById('top-loading-bar') || createLoadingBar();
        loadingBar.style.width = '0%';
        loadingBar.style.opacity = '1';
        requestAnimationFrame(() => { loadingBar.style.width = '40%'; });

        await resolveSession();

        const authed = isAuthenticated();
        const admin = isAdmin();

        // ── Route Guards ────────────────────────────────────────────────────
        if (route.auth && !authed) {
            showToast('Please sign in to access this page.', 'info');
            window.location.hash = '#/signin';
            loadingBar.style.opacity = '0';
            return;
        }

        if (route.adminOnly && !admin) {
            showToast('Admin access required.', 'error');
            window.location.hash = authed ? '#/dashboard' : '#/signin';
            loadingBar.style.opacity = '0';
            return;
        }

        if (route.guestOnly && authed) {
            window.location.hash = '#/dashboard';
            loadingBar.style.opacity = '0';
            return;
        }

        if (route.acceptedOnly && authed && !isAccepted()) {
            showToast('This page is only available to accepted participants.', 'info');
            window.location.hash = '#/dashboard';
            loadingBar.style.opacity = '0';
            return;
        }

        // ── Update SEO ──────────────────────────────────────────────────────
        updateSEO(route.title);

        // ── Animate out current page ────────────────────────────────────────
        const currentMain = app.querySelector('.main-content');
        if (currentMain) {
            currentMain.classList.add('page-exit');
        }

        loadingBar.style.width = '75%';
        await new Promise(r => setTimeout(r, 200));

        // ── Render ──────────────────────────────────────────────────────────
        app.innerHTML = `
      ${renderLoadingSpinner()}
      ${renderNavbar()}
      <main class="main-content page-transition-wrapper page-enter">
        ${route.render()}
      </main>
      ${renderFooter()}
    `;

        // Trigger enter animation
        requestAnimationFrame(() => {
            const newMain = app.querySelector('.main-content');
            if (newMain) {
                void newMain.offsetWidth;
                newMain.classList.add('page-enter-active');
                newMain.classList.remove('page-enter');
            }
        });

        // ── Initialize page logic ───────────────────────────────────────────
        if (route.init) {
            // init may be async (Dashboard, Apply, Admin pages)
            try {
                await route.init();
            } catch (err) {
                console.error('[Router] Page init error:', err);
            }
        }

        // ── Initialize Navbar ───────────────────────────────────────────────
        import('./components/Navbar.js').then(({ initNavbar }) => {
            if (initNavbar) initNavbar();
        });

        attachGlobalListeners();
        window.scrollTo(0, 0);

        // ── Finish loading bar ──────────────────────────────────────────────
        loadingBar.style.width = '100%';
        setTimeout(() => {
            loadingBar.style.opacity = '0';
            setTimeout(() => { loadingBar.style.width = '0%'; }, 200);
        }, 200);
    };

    window.addEventListener('hashchange', router);
    window.addEventListener('load', router);
}

function createLoadingBar() {
    const bar = document.createElement('div');
    bar.id = 'top-loading-bar';
    document.body.appendChild(bar);
    return bar;
}

function attachGlobalListeners() {
    const hamburger = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('nav-overlay');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
}
