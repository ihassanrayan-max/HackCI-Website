// ============================================
// Sign Up Page
// ============================================
import { icons } from '../assets/icons.js';
import { register, signInWithGoogle } from '../utils/auth.js';
import { showToast } from '../utils/toast.js';

const GOOGLE_ICON = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
</svg>`;

export function renderSignUp() {
    return `
    <div class="auth-page">
      <section class="page-hero" style="padding-bottom: var(--sp-4);">
        <div class="container"></div>
      </section>
      <section class="section auth-section">
        <div class="container">
          <div class="auth-card glass-card">
            <div class="auth-card__header">
              <h1 class="auth-card__title">Create Account</h1>
              <p class="auth-card__subtitle">Join HackCI and start building</p>
            </div>

            <button type="button" class="btn btn--google btn--lg" id="google-signup-btn">
              ${GOOGLE_ICON}
              Continue with Google
            </button>

            <div class="auth-divider"><span>or</span></div>

            <form class="auth-form" id="signup-form" novalidate>
              <div class="auth-form__name-row">
                <div class="input-group">
                  <label for="signup-fname">First Name</label>
                  <input type="text" id="signup-fname" name="firstName" class="input" placeholder="Alex" required autocomplete="given-name" />
                </div>
                <div class="input-group">
                  <label for="signup-lname">Last Name</label>
                  <input type="text" id="signup-lname" name="lastName" class="input" placeholder="Johnson" required autocomplete="family-name" />
                </div>
              </div>

              <div class="input-group">
                <label for="signup-email">Email Address</label>
                <input type="email" id="signup-email" name="email" class="input" placeholder="you@example.com" required autocomplete="email" />
              </div>

              <div class="input-group">
                <label for="signup-password">Password</label>
                <input type="password" id="signup-password" name="password" class="input" placeholder="Min 8 characters" required autocomplete="new-password" />
              </div>

              <div class="input-group">
                <label for="signup-confirm">Confirm Password</label>
                <input type="password" id="signup-confirm" name="confirmPassword" class="input" placeholder="Re-enter password" required autocomplete="new-password" />
              </div>

              <button type="submit" class="btn btn--primary btn--lg auth-form__submit" id="signup-submit-btn">
                Create Account ${icons.arrowRight}
              </button>

              <div id="signup-error" class="auth-form__error" style="display:none;" role="alert"></div>
            </form>

            <div class="auth-card__footer">
              Already have an account? <a href="#/signin">Sign In</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initSignUp() {
    const form = document.getElementById('signup-form');
    if (!form) return;

    const submitBtn = document.getElementById('signup-submit-btn');
    const googleBtn = document.getElementById('google-signup-btn');
    const errorBox = document.getElementById('signup-error');

    const setError = (msg) => {
        errorBox.textContent = msg;
        errorBox.style.display = msg ? 'block' : 'none';
    };

    const setLoading = (loading) => {
        submitBtn.disabled = loading;
        submitBtn.innerHTML = loading
            ? `<span class="auth-spinner"></span> Creating account…`
            : `Create Account ${icons.arrowRight}`;
    };

    const setGoogleLoading = (loading) => {
        googleBtn.disabled = loading;
        googleBtn.innerHTML = loading
            ? `<span class="auth-spinner auth-spinner--dark"></span> Redirecting…`
            : `${GOOGLE_ICON} Continue with Google`;
    };

    const mapError = (err) => {
        const msg = (err?.message || '').toLowerCase();
        if (msg.includes('already registered') || msg.includes('user_already_exists') || msg.includes('already exists')) {
            return 'An account with this email already exists. Try signing in instead.';
        }
        if (msg.includes('weak_password') || msg.includes('password should be')) {
            return 'Password is too weak. Use at least 8 characters with a mix of letters and numbers.';
        }
        if (msg.includes('invalid_email') || msg.includes('invalid email') || msg.includes('unable to validate')) {
            return 'Please enter a valid email address.';
        }
        if (msg.includes('over_email_send_rate_limit') || msg.includes('rate limit') || msg.includes('too many')) {
            return 'Too many sign-up attempts. Please wait a few minutes and try again.';
        }
        if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')) {
            return 'Network error. Please check your connection and try again.';
        }
        return err?.message || 'Sign up failed. Please try again.';
    };

    // Google sign-up
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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        setError('');

        const fname = form.querySelector('#signup-fname').value.trim();
        const lname = form.querySelector('#signup-lname').value.trim();
        const email = form.querySelector('#signup-email').value.trim();
        const password = form.querySelector('#signup-password').value;
        const confirm = form.querySelector('#signup-confirm').value;

        let valid = true;

        const fields = [
            { id: '#signup-fname', value: fname, check: (v) => v.length > 0 },
            { id: '#signup-lname', value: lname, check: (v) => v.length > 0 },
            { id: '#signup-email', value: email, check: (v) => v.includes('@') && v.includes('.') },
            { id: '#signup-password', value: password, check: (v) => v.length >= 8 },
        ];

        fields.forEach(({ id, value, check }) => {
            const el = form.querySelector(id);
            if (!check(value)) {
                el.classList.add('input--error');
                valid = false;
            } else {
                el.classList.remove('input--error');
            }
        });

        const confirmEl = form.querySelector('#signup-confirm');
        if (password !== confirm) {
            confirmEl.classList.add('input--error');
            setError('Passwords do not match.');
            valid = false;
        } else {
            confirmEl.classList.remove('input--error');
        }

        if (!valid) {
            if (!errorBox.textContent) setError('Please fill in all fields correctly.');
            return;
        }

        setLoading(true);
        try {
            const data = await register(email, password, fname, lname);

            if (data.user && data.session) {
                // Signed up and immediately logged in (email confirmation disabled)
                showToast('Account created successfully!', 'success');
                setTimeout(() => { window.location.hash = '#/dashboard'; }, 400);
            } else if (data.user && !data.session) {
                // Email confirmation required
                showToast('Account created! Check your email to confirm your address.', 'success');
                setTimeout(() => { window.location.hash = '#/signin'; }, 1000);
            } else {
                // Supabase returns nulls silently for duplicate emails when confirmation is on.
                // We never claim success — give a neutral, security-safe message.
                setLoading(false);
                showToast('If that email isn\'t already registered, you\'ll receive a confirmation email shortly.', 'info');
                setTimeout(() => { window.location.hash = '#/signin'; }, 2000);
            }
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
