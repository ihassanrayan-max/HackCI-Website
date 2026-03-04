// ============================================
// Dashboard Page
// ============================================
import { icons } from '../assets/icons.js';
import { getUser } from '../utils/auth.js';
import { supabase } from '../utils/supabase.js';
import { renderCountdown, initCountdown } from '../components/CountdownTimer.js';

const STATUS_CONFIG = {
    not_started: {
        label: 'Not Started',
        class: 'status-badge--draft',
        icon: icons.edit,
        message: 'You haven\'t started your application yet. Click below to get started — it only takes a few minutes!',
        cta: { href: '#/apply', text: 'Start Application', icon: icons.arrowRight, class: 'btn--primary' },
    },
    draft: {
        label: 'Draft — In Progress',
        class: 'status-badge--pending',
        icon: icons.clock,
        message: 'Your application is saved as a draft. Pick up where you left off — don\'t forget to submit before the deadline!',
        cta: { href: '#/apply', text: 'Continue Application', icon: icons.arrowRight, class: 'btn--primary' },
    },
    submitted: {
        label: 'Submitted',
        class: 'status-badge--submitted',
        icon: icons.check,
        message: 'Your application has been submitted. Our team will review it shortly.',
        cta: { href: '#/apply', text: 'View Application', icon: icons.arrowRight, class: 'btn--secondary' },
    },
    under_review: {
        label: 'Under Review',
        class: 'status-badge--pending',
        icon: icons.clock,
        message: 'Your application is currently being reviewed by our team. We\'ll notify you by email once a decision is made.',
        cta: { href: '#/apply', text: 'View Application', icon: icons.arrowRight, class: 'btn--secondary' },
    },
    accepted: {
        label: 'Accepted! 🎉',
        class: 'status-badge--accepted',
        icon: icons.sparkles,
        message: 'Congratulations! You\'ve been accepted to HackCI. Check your email for next steps, and join our Discord to connect with the community!',
        cta: { href: '#', text: 'Join Discord', icon: icons.discord, class: 'btn--primary' },
    },
    rejected: {
        label: 'Not Selected',
        class: 'status-badge--rejected',
        icon: icons.close,
        message: 'Unfortunately we weren\'t able to offer you a spot this time. Thank you for applying — we hope to see you at a future event!',
        cta: null,
    },
    waitlisted: {
        label: 'Waitlisted',
        class: 'status-badge--pending',
        icon: icons.clock,
        message: 'You\'ve been placed on our waitlist. We\'ll reach out if a spot opens up. Thank you for your patience!',
        cta: null,
    },
};

export function renderDashboard() {
    const user = getUser() || { first_name: 'Hacker', last_name: '', email: '' };
    const displayName = user.preferred_name || user.first_name || user.name || 'Hacker';

    return `
    <div class="dashboard-page">
      <section class="page-hero" style="padding-bottom: var(--sp-4);">
        <div class="container"></div>
      </section>
      <section class="section dashboard-section">
        <div class="container">
          <!-- Welcome Header -->
          <div class="dashboard__welcome">
            <div>
              <h1 class="dashboard__title">Welcome back, <span class="text-accent">${escapeHtml(displayName)}</span>!</h1>
              <p class="dashboard__subtitle">Here's an overview of your hackathon journey.</p>
            </div>
            <a href="#/profile" class="btn btn--secondary">
              ${icons.edit} Edit Profile
            </a>
          </div>

          <!-- Main Grid -->
          <div class="dashboard__grid">
            <!-- Status Card (will be populated by initDashboard) -->
            <div class="dashboard__status glass-card" id="dashboard-status-card">
              <h3 class="dashboard__card-title">Application Status</h3>
              <div class="dashboard__status-loading">
                <div class="dashboard__status-spinner"></div>
              </div>
            </div>

            <!-- Team Hub CTA (visible only for accepted users, populated in initDashboard) -->
            <div class="dashboard__team-hub glass-card" id="dashboard-team-hub-cta" style="display: none;"></div>

            <!-- Quick Actions -->
            <div class="dashboard__actions glass-card">
              <h3 class="dashboard__card-title">Quick Actions</h3>
              <div class="dashboard__actions-grid">
                <a href="#/profile" class="dashboard__action-item card">
                  <div class="card__icon">${icons.edit}</div>
                  <span>Edit Profile</span>
                </a>
                <a href="#/schedule" class="dashboard__action-item card">
                  <div class="card__icon">${icons.calendar}</div>
                  <span>View Schedule</span>
                </a>
                <a href="#" class="dashboard__action-item card">
                  <div class="card__icon">${icons.discord}</div>
                  <span>Join Discord</span>
                </a>
                <a href="#/apply" class="dashboard__action-item card" id="dashboard-apply-action">
                  <div class="card__icon">${icons.sparkles}</div>
                  <span>Application</span>
                </a>
              </div>
            </div>

            <!-- Countdown Widget -->
            <div class="dashboard__countdown glass-card">
              <h3 class="dashboard__card-title">Event Countdown</h3>
              ${renderCountdown()}
            </div>

            <!-- Notifications -->
            <div class="dashboard__notifications glass-card">
              <h3 class="dashboard__card-title">Notifications</h3>
              <div class="dashboard__notif-list" id="dashboard-notif-list">
                <div class="dashboard__notif-item">
                  <div class="dashboard__notif-icon">${icons.bell}</div>
                  <div class="dashboard__notif-content">
                    <p>Welcome to HackCI! Complete your application to secure your spot.</p>
                    <span class="dashboard__notif-time">Just now</span>
                  </div>
                </div>
                <div class="dashboard__notif-item">
                  <div class="dashboard__notif-icon">${icons.calendar}</div>
                  <div class="dashboard__notif-content">
                    <p>Hacking begins soon. Check the schedule for details.</p>
                    <span class="dashboard__notif-time">2 hours ago</span>
                  </div>
                </div>
                <div class="dashboard__notif-item">
                  <div class="dashboard__notif-icon">${icons.sparkles}</div>
                  <div class="dashboard__notif-content">
                    <p>New workshop added: "Building with AI APIs" — Day 2 at 10:30 AM.</p>
                    <span class="dashboard__notif-time">1 day ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export async function initDashboard() {
    initCountdown();
    await loadApplicationStatus();
}

async function loadApplicationStatus() {
    const user = getUser();
    if (!user) return;

    const card = document.getElementById('dashboard-status-card');
    if (!card) return;

    try {
        const { data: app } = await supabase
            .from('applications')
            .select('status, submitted_at, updated_at')
            .eq('user_id', user.id)
            .maybeSingle();

        const status = app?.status || 'not_started';
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;

        card.innerHTML = `
      <h3 class="dashboard__card-title">Application Status</h3>
      <div class="dashboard__status-display">
        <span class="status-badge ${config.class}">
          <span class="status-badge__dot"></span>
          ${config.label}
        </span>
      </div>
      <p class="dashboard__status-message">${config.message}</p>
      ${config.cta ? `
        <a href="${config.cta.href}" class="btn ${config.cta.class} dashboard__status-cta">
          ${config.cta.text} ${config.cta.icon}
        </a>
      ` : ''}
      ${app?.submitted_at ? `
        <p class="dashboard__status-meta">Submitted: ${new Date(app.submitted_at).toLocaleDateString('en-CA', { dateStyle: 'medium' })}</p>
      ` : ''}
    `;

        // Update the application action card text based on status
        const applyAction = document.getElementById('dashboard-apply-action');
        if (applyAction) {
            const actionLabels = {
                not_started: 'Start Applying',
                draft: 'Continue',
                submitted: 'View',
                under_review: 'View',
                accepted: 'View',
                rejected: 'View',
                waitlisted: 'View',
            };
            const labelEl = applyAction.querySelector('span');
            if (labelEl) labelEl.textContent = actionLabels[status] || 'Application';
        }

        // Team Hub CTA for accepted users
        const teamHubCta = document.getElementById('dashboard-team-hub-cta');
        if (teamHubCta) {
            if (status === 'accepted') {
                teamHubCta.style.display = '';
                teamHubCta.innerHTML = `
          <h3 class="dashboard__card-title">${icons.users} Team Hub</h3>
          <p class="dashboard__status-message">Create or join a team for the hackathon. Find teammates and build something amazing together!</p>
          <a href="#/teams" class="btn btn--primary dashboard__status-cta">
            Open Team Hub ${icons.arrowRight}
          </a>
        `;
            } else {
                teamHubCta.style.display = 'none';
            }
        }

    } catch (err) {
        console.error('[Dashboard] Status load error:', err);
        card.innerHTML = `
      <h3 class="dashboard__card-title">Application Status</h3>
      <p class="dashboard__status-message text-muted">Could not load status. Please refresh.</p>
      <a href="#/apply" class="btn btn--primary dashboard__status-cta">Open Application ${icons.arrowRight}</a>
    `;
    }
}

// Add status-badge--submitted and status-badge--draft to global components.css
// (handled in Dashboard.css overrides below)

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
