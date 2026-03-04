// ============================================
// Admin Application Detail View
// ============================================
import { supabase } from '../utils/supabase.js';
import { getUser } from '../utils/auth.js';
import { icons } from '../assets/icons.js';
import { showToast } from '../utils/toast.js';
import { getQuestionsBySection } from '../data/applicationQuestions.js';
import { buildAvatarHtml } from '../utils/avatar.js';

const DECISION_OPTIONS = [
    { value: 'accepted',    label: 'Accept',       class: 'decision--accept' },
    { value: 'rejected',    label: 'Reject',       class: 'decision--reject' },
    { value: 'waitlisted',  label: 'Waitlist',     class: 'decision--waitlist' },
    { value: 'under_review',label: 'Under Review', class: 'decision--review' },
];

const COMMON_TAGS = [
    'Strong builder', 'Great designer', 'Clear communicator', 'First-timer',
    'Needs travel support', 'Beginner-friendly', 'Advanced skills', 'Team lead',
    'AI focus', 'Hardware focus', 'Social impact', 'Interview candidate',
];

// Extract application ID from hash like #/admin/application/uuid
function getAppIdFromHash() {
    const hash = window.location.hash;
    const match = hash.match(/#\/admin\/application\/([^?#]+)/);
    return match ? match[1] : null;
}

export function renderAdminApplication() {
    return `
    <div class="admin-page admin-detail-page">
      <section class="page-hero" style="padding-bottom: var(--sp-4);">
        <div class="container"></div>
      </section>
      <section class="section admin-section">
        <div class="container">
          <div id="admin-app-detail-root">
            <div class="admin-loading">
              <div class="admin-spinner"></div>
              <p>Loading application…</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export async function initAdminApplication() {
    const appId = getAppIdFromHash();
    if (!appId) {
        window.location.hash = '#/admin';
        return;
    }
    await loadAndRender(appId);
}

async function loadAndRender(appId) {
    const root = document.getElementById('admin-app-detail-root');
    if (!root) return;

    try {
        const [{ data: app, error: appError }, { data: reviewRows, error: reviewError }] = await Promise.all([
            supabase
                .from('applications')
                .select(`
                    *,
                    profiles!applications_user_id_fkey (id, first_name, last_name, email, role, avatar_path)
                `)
                .eq('id', appId)
                .single(),
            supabase
                .from('admin_reviews')
                .select('*')
                .eq('application_id', appId)
                .maybeSingle(),
        ]);

        if (appError) throw appError;
        if (reviewError) throw reviewError;

        const profile = app.profiles || {};
        const review = reviewRows || null;
        const answers = app.answers || {};

        // Normalize tags: DB returns array; ensure we always have string[]
        const reviewTags = Array.isArray(review?.tags) ? review.tags : [];

        const firstName = answers.legal_first_name || profile.first_name || 'Applicant';
        const lastName = answers.legal_last_name || profile.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const email = profile.email || '—';

        const avatarHtml = buildAvatarHtml(
            { avatarPath: profile.avatar_path, userId: profile.id, displayName: fullName || 'Applicant', sizeClass: 'avatar--lg' },
            escapeHtml
        );

        root.innerHTML = `
      <!-- Back + Header -->
      <div class="admin-detail-header">
        <a href="#/admin" class="apply-back-link">
          ${icons.arrowRight} Back to All Applications
        </a>
      </div>

      <div class="admin-detail-grid">

        <!-- LEFT: Application Answers -->
        <div class="admin-detail-answers">
          <div class="admin-detail-title-row glass-card">
            <div class="admin-applicant admin-applicant--lg">
              <div class="admin-applicant__avatar admin-applicant__avatar--lg">${avatarHtml}</div>
              <div>
                <h1 class="admin-detail-name">${escapeHtml(fullName)}</h1>
                <p class="admin-detail-email">${escapeHtml(email)}</p>
                <div class="admin-detail-meta">
                  <span class="badge ${getStatusClass(app.status)}">${formatStatus(app.status)}</span>
                  ${app.submitted_at ? `<span class="admin-meta-item">Submitted ${formatDate(app.submitted_at)}</span>` : ''}
                  <span class="admin-meta-item">Applied ${formatDate(app.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          ${renderAnswerSections(answers)}
        </div>

        <!-- RIGHT: Admin Review Panel -->
        <div class="admin-review-panel">
          <div class="admin-review-card glass-card">
            <h2 class="admin-review-card__title">Review Decision</h2>

            <!-- Decision -->
            <div class="admin-review-section">
              <label class="admin-review-label">Decision</label>
              <div class="admin-decision-group" id="admin-decision-group">
                ${DECISION_OPTIONS.map(opt => `
                  <button
                    type="button"
                    class="btn admin-decision-btn ${opt.class} ${review?.decision === opt.value ? 'admin-decision-btn--active' : ''}"
                    data-decision="${opt.value}"
                  >
                    ${opt.label}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Score -->
            <div class="admin-review-section">
              <label class="admin-review-label">Score (1–5)</label>
              <div class="admin-score-group" id="admin-score-group">
                ${[1, 2, 3, 4, 5].map(n => `
                  <button
                    type="button"
                    class="btn admin-score-btn ${(review?.score ?? 0) >= n ? 'admin-score-btn--filled' : ''}"
                    data-score="${n}"
                    aria-label="Score ${n}"
                  >
                    ${icons.sparkles}
                  </button>
                `).join('')}
                <span class="admin-score-value" id="admin-score-value">${review?.score != null ? review.score : '—'}</span>
              </div>
            </div>

            <!-- Tags -->
            <div class="admin-review-section">
              <label class="admin-review-label">Tags</label>
              <div class="admin-tag-suggestions" id="admin-tag-suggestions">
                ${COMMON_TAGS.map(tag => `
                  <button type="button" class="admin-tag-btn ${reviewTags.includes(tag) ? 'admin-tag-btn--active' : ''}" data-tag="${escapeHtml(tag)}">
                    ${escapeHtml(tag)}
                  </button>
                `).join('')}
              </div>
              <input
                type="text"
                id="admin-custom-tag"
                class="input admin-custom-tag-input"
                placeholder="Add custom tag + Enter"
                aria-label="Custom tag"
              />
              <div class="admin-active-tags" id="admin-active-tags">
                ${reviewTags.map(tag => renderActiveTag(tag)).join('')}
              </div>
            </div>

            <!-- Notes -->
            <div class="admin-review-section">
              <label class="admin-review-label" for="admin-notes">Internal Notes</label>
              <textarea
                id="admin-notes"
                class="input admin-notes-textarea"
                placeholder="Notes visible only to admins…"
                rows="5"
              >${escapeHtml(review?.notes || '')}</textarea>
            </div>

            <!-- Save Button -->
            <button class="btn btn--primary admin-save-btn" id="admin-save-decision">
              Save Decision ${icons.check}
            </button>

            ${review ? `
              <div class="admin-review-meta">
                Last updated: ${formatDate(review.updated_at)}
              </div>
            ` : ''}
          </div>

          <!-- Audit Info -->
          <div class="admin-audit glass-card">
            <h3 class="admin-audit__title">Audit Info</h3>
            <div class="admin-audit__row"><span>Application ID</span><code>${app.id.slice(0, 8)}…</code></div>
            <div class="admin-audit__row"><span>Created</span><span>${formatDate(app.created_at)}</span></div>
            <div class="admin-audit__row"><span>Last Updated</span><span>${formatDate(app.updated_at)}</span></div>
            ${app.submitted_at ? `<div class="admin-audit__row"><span>Submitted</span><span>${formatDate(app.submitted_at)}</span></div>` : ''}
            ${review ? `<div class="admin-audit__row"><span>Decision By</span><span>${review.admin_id?.slice(0, 8)}…</span></div>` : ''}
          </div>
        </div>

      </div>
    `;

        // Wire interactions
        wireReviewPanel(app, review);

    } catch (err) {
        console.error('[AdminApp] Load error:', err);
        root.innerHTML = `
      <div class="admin-error">
        <p>Failed to load application: ${err.message}</p>
        <a href="#/admin" class="btn btn--secondary">Back to Dashboard</a>
      </div>`;
    }
}

function renderAnswerSections(answers) {
    const sections = getQuestionsBySection(answers);
    return sections.map(sec => `
    <div class="admin-answers-section glass-card">
      <h3 class="admin-answers-section__title">
        <span class="review-section__letter">${sec.id}</span>
        ${sec.title}
      </h3>
      <div class="admin-answers-grid">
        ${sec.questions.map(q => {
        const val = answers[q.id];
        const displayVal = formatAnswer(q, val);
        if (!displayVal && !q.required) return '';
        return `
          <div class="admin-answer-row">
            <span class="admin-answer-label">${q.question}</span>
            <span class="admin-answer-value ${!displayVal ? 'text-muted' : ''}">${displayVal || '<em>Not answered</em>'}</span>
          </div>
        `;
    }).join('')}
      </div>
    </div>
  `).join('');
}

function formatAnswer(q, val) {
    if (val === undefined || val === null || val === '') return '';
    if (Array.isArray(val)) return val.join(', ') || '';
    if (q.type === 'url' && val) {
        return `<a href="${escapeHtml(val)}" target="_blank" rel="noopener">${escapeHtml(val)}</a>`;
    }
    return escapeHtml(String(val));
}

// ── Review Panel Interactivity ───────────────────────────────────────────────
function wireReviewPanel(app, existingReview) {
    let selectedDecision = existingReview?.decision || null;
    let selectedScore = existingReview?.score != null ? existingReview.score : null;
    let activeTags = Array.isArray(existingReview?.tags)
        ? existingReview.tags.filter(t => typeof t === 'string')
        : [];

    // Decision buttons
    document.getElementById('admin-decision-group')?.querySelectorAll('[data-decision]').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedDecision = btn.dataset.decision;
            document.querySelectorAll('[data-decision]').forEach(b => b.classList.remove('admin-decision-btn--active'));
            btn.classList.add('admin-decision-btn--active');
        });
    });

    // Score buttons
    const scoreBtns = document.querySelectorAll('.admin-score-btn');
    const scoreVal = document.getElementById('admin-score-value');

    scoreBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const n = parseInt(btn.dataset.score);
            selectedScore = n;
            if (scoreVal) scoreVal.textContent = n;
            scoreBtns.forEach((b, i) => {
                b.classList.toggle('admin-score-btn--filled', i < n);
            });
        });
    });

    // Tag suggestion buttons
    document.getElementById('admin-tag-suggestions')?.querySelectorAll('[data-tag]').forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.dataset.tag;
            const idx = activeTags.indexOf(tag);
            if (idx >= 0) {
                activeTags.splice(idx, 1);
                btn.classList.remove('admin-tag-btn--active');
            } else {
                activeTags.push(tag);
                btn.classList.add('admin-tag-btn--active');
            }
            refreshActiveTags(activeTags);
        });
    });

    // Custom tag input
    document.getElementById('admin-custom-tag')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tag = e.target.value.trim();
            if (tag && !activeTags.includes(tag)) {
                activeTags.push(tag);
                refreshActiveTags(activeTags);
                // Also highlight if it's a preset
                document.querySelectorAll(`[data-tag="${CSS.escape(tag)}"]`).forEach(b => b.classList.add('admin-tag-btn--active'));
            }
            e.target.value = '';
        }
    });

    // Active tags: allow removal
    document.getElementById('admin-active-tags')?.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('[data-remove-tag]');
        if (!removeBtn) return;
        const tag = removeBtn.dataset.removeTag;
        activeTags = activeTags.filter(t => t !== tag);
        refreshActiveTags(activeTags);
        document.querySelectorAll(`[data-tag="${CSS.escape(tag)}"]`).forEach(b => b.classList.remove('admin-tag-btn--active'));
    });

    // Save decision
    document.getElementById('admin-save-decision')?.addEventListener('click', async () => {
        const notes = document.getElementById('admin-notes')?.value || '';
        const adminUser = getUser();

        if (!selectedDecision) {
            showToast('Please select a decision before saving.', 'error');
            return;
        }

        const saveBtn = document.getElementById('admin-save-decision');
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<span class="auth-spinner"></span> Saving…`;

        try {
            // Upsert review — persist all fields; each applicant has own row
            const reviewPayload = {
                application_id: app.id,
                admin_id: adminUser.id,
                decision: selectedDecision,
                notes: notes || null,
                tags: Array.isArray(activeTags) ? activeTags : [],
                score: selectedScore != null ? selectedScore : null,
            };
            const { error: reviewError } = await supabase
                .from('admin_reviews')
                .upsert(reviewPayload, { onConflict: 'application_id' });

            if (reviewError) throw reviewError;

            // Update application status
            const { error: appError } = await supabase
                .from('applications')
                .update({ status: selectedDecision, updated_at: new Date().toISOString() })
                .eq('id', app.id);

            if (appError) throw appError;

            showToast(`Decision saved: ${formatDecision(selectedDecision)}`, 'success');
            saveBtn.disabled = false;
            saveBtn.innerHTML = `Decision Saved ${icons.check}`;
            setTimeout(() => {
                if (saveBtn) saveBtn.innerHTML = `Save Decision ${icons.check}`;
            }, 2500);

        } catch (err) {
            console.error('[AdminApp] Save error:', err);
            showToast('Failed to save decision. Please try again.', 'error');
            saveBtn.disabled = false;
            saveBtn.innerHTML = `Save Decision ${icons.check}`;
        }
    });
}

function refreshActiveTags(tags) {
    const container = document.getElementById('admin-active-tags');
    if (!container) return;
    container.innerHTML = tags.map(renderActiveTag).join('');
}

function renderActiveTag(tag) {
    return `<span class="admin-active-tag">
    ${escapeHtml(tag)}
    <button class="admin-active-tag__remove" data-remove-tag="${escapeHtml(tag)}" aria-label="Remove tag ${escapeHtml(tag)}">×</button>
  </span>`;
}

// ── Utilities ────────────────────────────────────────────────────────────────
function getInitials(first, last) {
    return `${(first || '?')[0]}${(last || '?')[0]}`.toUpperCase();
}

function formatStatus(status) {
    const map = { draft: 'Draft', submitted: 'Submitted', under_review: 'Under Review', accepted: 'Accepted', rejected: 'Rejected', waitlisted: 'Waitlisted' };
    return map[status] || status;
}

function formatDecision(d) {
    return { accepted: 'Accepted', rejected: 'Rejected', waitlisted: 'Waitlisted', under_review: 'Under Review' }[d] || d;
}

function getStatusClass(status) {
    const map = { draft: 'badge--draft', submitted: 'badge--submitted', under_review: 'badge--review', accepted: 'badge--accepted', rejected: 'badge--rejected', waitlisted: 'badge--waitlisted' };
    return map[status] || '';
}

function formatDate(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
