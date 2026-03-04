// ============================================
// Sign In Page
// ============================================
import { icons } from '../assets/icons.js';
import { login, signInWithGoogle } from '../utils/auth.js';
import { showToast } from '../utils/toast.js';
import { supabase } from '../utils/supabase.js';

const GOOGLE_ICON = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
</svg>`;

export function renderSignIn() {
    return `
    <div class="auth-page">
      <section class="page-hero" style="padding-bottom: var(--sp-4);">
        <div class="container"></div>
      </section>
      <section class="section auth-section">
        <div class="container">
          <div class="auth-card glass-card">
            <div class="auth-card__header">
              <h1 class="auth-card__title">Welcome Back</h1>
              <p class="auth-card__subtitle">Sign in to your HackCI account</p>
            </div>

            <button type="button" class="btn btn--google btn--lg" id="google-signin-btn">
              ${GOOGLE_ICON}
              Continue with Google
            </button>

            <div class="auth-divider"><span>or</span></div>

            <form class="auth-form" id="signin-form" novalidate>
              <div class="input-group">
                <label for="signin-email">Email Address</label>
                <input type="email" id="signin-email" name="email" class="input" placeholder="you@example.com" required autocomplete="email" />
              </div>

              <div class="input-group">
                <label for="signin-password">Password</label>
                <input type="password" id="signin-password" name="password" class="input" placeholder="Enter your password" required autocomplete="current-password" />
              </div>

              <div class="auth-form__options">
                <span></span>
                <a href="#" class="auth-form__forgot" id="forgot-password-link">Forgot password?</a>
              </div>

              <button type="submit" class="btn btn--primary btn--lg auth-form__submit" id="signin-submit-btn">
                Sign In ${icons.arrowRight}
              </button>

              <div id="signin-error" class="auth-form__error" style="display:none;" role="alert"></div>
            </form>

            <div class="auth-card__footer">
              Don't have an account? <a href="#/signup">Sign Up</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initSignIn() {
    const form = document.getElementById('signin-form');
    if (!form) return;

    const submitBtn = document.getElementById('signin-submit-btn');
    const googleBtn = document.getElementById('google-signin-btn');
    const errorBox = document.getElementById('signin-error');

    const setError = (msg) => {
        errorBox.textContent = msg;
        errorBox.style.display = msg ? 'block' : 'none';
    };

    const setLoading = (loading) => {
        submitBtn.disabled = loading;
        submitBtn.innerHTML = loading
            ? `<span class="auth-spinner"></span> Signing in…`
            : `Sign In ${icons.arrowRight}`;
    };

    const setGoogleLoading = (loading) => {
        googleBtn.disabled = loading;
        googleBtn.innerHTML = loading
            ? `<span class="auth-spinner auth-spinner--dark"></span> Redirecting…`
            : `${GOOGLE_ICON} Continue with Google`;
    };

    const mapError = (err) => {
        const msg = (err?.message || '').toLowerCase();
        if (msg.includes('invalid') || msg.includes('invalid_credentials') || msg.includes('wrong') || msg.includes('no user found')) {
            return 'Incorrect email or password. Please try again.';
        }
        if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
            return 'Please confirm your email before signing in. Check your inbox.';
        }
        if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('over_request_rate_limit')) {
            return 'Too many sign-in attempts. Please wait a few minutes and try again.';
        }
        if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')) {
            return 'Network error. Please check your connection and try again.';
        }
        return err?.message || 'Sign in failed. Please try again.';
    };

    // Google sign-in
    googleBtn?.addEventListener('click', async () => {
        setError('');
        setGoogleLoading(true);
        try {
            await signInWithGoogle();
            // Browser redirects to Google — execution stops here
        } catch (err) {
            setGoogleLoading(false);
            setError('Could not connect to Google. Please try again.');
        }
    });

    // Forgot password
    document.getElementById('forgot-password-link')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = form.querySelector('#signin-email').value.trim();
        if (!email) {
            setError('Enter your email address first, then click Forgot Password.');
            return;
        }
        try {
            await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/#/reset-password`,
            });
            showToast('Password reset email sent! Check your inbox.', 'success');
        } catch {
            showToast('Could not send reset email. Try again.', 'error');
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        setError('');

        const email = form.querySelector('#signin-email').value.trim();
        const password = form.querySelector('#signin-password').value;

        let valid = true;

        if (!email || !email.includes('@')) {
            form.querySelector('#signin-email').classList.add('input--error');
            valid = false;
        } else {
            form.querySelector('#signin-email').classList.remove('input--error');
        }

        if (!password || password.length < 6) {
            form.querySelector('#signin-password').classList.add('input--error');
            valid = false;
        } else {
            form.querySelector('#signin-password').classList.remove('input--error');
        }

        if (!valid) {
            setError('Please fill in all fields correctly.');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            showToast('Signed in successfully!', 'success');
            setTimeout(() => { window.location.hash = '#/dashboard'; }, 400);
        } catch (err) {
            setLoading(false);
            setError(mapError(err));
        }
    });

    // Clear field-level error styling on input
    form.querySelectorAll('.input').forEach((input) => {
        input.addEventListener('input', () => input.classList.remove('input--error'));
    });
}
