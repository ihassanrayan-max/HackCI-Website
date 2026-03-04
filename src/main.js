// ============================================
// HackCI — Main Entry Point
// ============================================

// Styles
import './styles/variables.css';
import './styles/reset.css';
import './styles/global.css';
import './styles/components.css';
import './styles/navbar.css';
import './styles/footer.css';

// Page styles
import './pages/Landing.css';
import './pages/About.css';
import './pages/Schedule.css';
import './pages/FAQ.css';
import './pages/SignIn.css';
import './pages/SignUp.css';
import './pages/Dashboard.css';
import './pages/Profile.css';
import './components/LoadingSpinner.css';
import './styles/animations.css';
import './pages/NotFound.css';
import './styles/legal.css';

// Premium Component Styles
import './styles/components/modal.css';
import './styles/components/page-navigator.css';

// Application + Admin styles
import './styles/apply.css';
import './styles/admin.css';
import './styles/teams.css';

// Theme
import { initTheme } from './components/ThemeToggle.js';

// Router
import { initRouter } from './router.js';

// Initialize theme before anything renders
initTheme();

// Boot the router
initRouter();
