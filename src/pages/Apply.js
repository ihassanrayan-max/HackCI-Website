// ============================================
// Apply Page — One-Question-at-a-Time Form
// ============================================
import { supabase } from '../utils/supabase.js';
import { getUser } from '../utils/auth.js';
import { showToast } from '../utils/toast.js';
import { icons } from '../assets/icons.js';
import {
    questions,
    getActiveQuestions,
    getQuestionsBySection,
    getSectionTitle,
} from '../data/applicationQuestions.js';

// ── Module-level state ──────────────────────────────────────────────────────
const state = {
    applicationId: null,
    answers: {},
    currentStep: 0,
    isReview: false,
    isSaving: false,
    saveTimer: null,
    isSubmitted: false,
};

// ── Render shell (static, returned once) ───────────────────────────────────
export function renderApply() {
    return `
    <div class="apply-page">
      <div class="apply-container">
        <!-- Progress Header -->
        <div class="apply-header" id="apply-header">
          <a href="#/dashboard" class="apply-back-link">
            ${icons.arrowRight} <span>Dashboard</span>
          </a>
          <div class="apply-progress-wrap">
            <div class="apply-progress-bar-track">
              <div class="apply-progress-bar" id="apply-progress-bar" style="width:0%"></div>
            </div>
            <span class="apply-progress-label" id="apply-progress-label">Loading…</span>
          </div>
          <div class="apply-save-indicator" id="apply-save-indicator" aria-live="polite"></div>
        </div>

        <!-- Step container -->
        <div class="apply-step-wrap" id="apply-step-wrap">
          <div class="apply-loading">
            <div class="apply-loading-spinner"></div>
            <p>Loading your application…</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── Init ────────────────────────────────────────────────────────────────────
export async function initApply() {
    // Reset state
    Object.assign(state, {
        applicationId: null,
        answers: {},
        currentStep: 0,
        isReview: false,
        isSaving: false,
        saveTimer: null,
        isSubmitted: false,
    });

    const user = getUser();
    if (!user) {
        window.location.hash = '#/signin';
        return;
    }

    try {
        // Load or create draft
        let { data: app, error } = await supabase
            .from('applications')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        if (!app) {
            const { data: newApp, error: insertErr } = await supabase
                .from('applications')
                .insert({ user_id: user.id, status: 'draft', answers: {}, current_step: 0 })
                .select()
                .single();
            if (insertErr) throw insertErr;
            app = newApp;
        }

        state.applicationId = app.id;
        state.answers = app.answers || {};
        state.currentStep = app.current_step || 0;
        state.isSubmitted = app.status !== 'draft';

        if (state.isSubmitted) {
            renderSubmittedState(app.status);
            return;
        }

        // Clear loading state so it cannot block clicks
        const wrap = document.getElementById('apply-step-wrap');
        wrap?.querySelectorAll('.apply-loading').forEach(el => el.remove());

        // Prefill email from user profile
        if (!state.answers.email) {
            state.answers.email = user.email || '';
        }
        if (!state.answers.legal_first_name && user.first_name) {
            state.answers.legal_first_name = user.first_name;
        }
        if (!state.answers.legal_last_name && user.last_name) {
            state.answers.legal_last_name = user.last_name;
        }

        renderStep();
    } catch (err) {
        console.error('[Apply] Init error:', err);
        document.getElementById('apply-step-wrap').innerHTML = `
      <div class="apply-error">
        <p>Something went wrong loading your application. Please refresh and try again.</p>
        <a href="#/dashboard" class="btn btn--secondary">Back to Dashboard</a>
      </div>`;
    }
}

// ── Get flat list of active steps based on current answers ──────────────────
function getSteps() {
    return getActiveQuestions(state.answers);
}

// ── Progress ────────────────────────────────────────────────────────────────
function updateProgress() {
    const steps = getSteps();
    const total = steps.length;
    const current = Math.min(state.currentStep, total - 1);
    const pct = state.isReview ? 100 : Math.round(((current + 1) / total) * 100);

    const bar = document.getElementById('apply-progress-bar');
    const label = document.getElementById('apply-progress-label');
    if (bar) bar.style.width = `${pct}%`;
    if (label) {
        if (state.isReview) {
            label.textContent = 'Review & Submit';
        } else {
            const q = steps[current];
            label.textContent = `${current + 1} / ${total} — ${getSectionTitle(q?.section || 'A')}`;
        }
    }
}

// ── Save indicator ──────────────────────────────────────────────────────────
function showSaveIndicator(status) {
    const el = document.getElementById('apply-save-indicator');
    if (!el) return;
    if (status === 'saving') {
        el.innerHTML = `<span class="save-dot save-dot--saving"></span> Saving…`;
    } else if (status === 'saved') {
        el.innerHTML = `<span class="save-dot save-dot--saved"></span> Saved`;
        setTimeout(() => { if (el) el.innerHTML = ''; }, 2500);
    } else if (status === 'error') {
        el.innerHTML = `<span class="save-dot save-dot--error"></span> Save failed`;
    }
}

// ── Debounced autosave ──────────────────────────────────────────────────────
function scheduleAutosave() {
    if (state.saveTimer) clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(autosave, 1500);
}

async function autosave() {
    if (!state.applicationId || state.isSubmitted) return;
    state.isSaving = true;
    showSaveIndicator('saving');
    try {
        const steps = getSteps();
        const safeStep = Math.min(state.currentStep, steps.length - 1);
        await supabase
            .from('applications')
            .update({ answers: state.answers, current_step: safeStep, updated_at: new Date().toISOString() })
            .eq('id', state.applicationId);
        showSaveIndicator('saved');
    } catch {
        showSaveIndicator('error');
    } finally {
        state.isSaving = false;
    }
}

// ── Render a single question step ───────────────────────────────────────────
function renderStep(direction = 'forward') {
    if (state.isReview) {
        renderReviewScreen();
        return;
    }

    const steps = getSteps();
    if (state.currentStep >= steps.length) {
        state.isReview = true;
        renderReviewScreen();
        return;
    }

    const q = steps[state.currentStep];
    const wrap = document.getElementById('apply-step-wrap');
    if (!wrap) return;

    // Remove loading overlay fully so it cannot block clicks
    wrap.querySelectorAll('.apply-loading').forEach(el => el.remove());

    updateProgress();

    const isFirst = state.currentStep === 0;
    const isLast = state.currentStep === steps.length - 1;

    const inputHtml = renderInput(q);

    const newStep = document.createElement('div');
    newStep.className = `apply-step apply-step--${direction === 'forward' ? 'enter-right' : 'enter-left'}`;
    newStep.setAttribute('role', 'form');
    newStep.setAttribute('aria-label', q.question);
    newStep.innerHTML = `
    <div class="apply-question-card glass-card">
      <div class="apply-section-badge">${getSectionTitle(q.section)}</div>
      <h2 class="apply-question-text">
        ${q.question}
        ${q.required ? '<span class="apply-required" aria-hidden="true">*</span>' : '<span class="apply-optional">optional</span>'}
      </h2>
      ${q.helper ? `<p class="apply-helper">${q.helper}</p>` : ''}
      <div class="apply-input-wrap" id="apply-input-wrap">
        ${inputHtml}
      </div>
      <div class="apply-field-error" id="apply-field-error" role="alert" aria-live="polite"></div>
    </div>

    <div class="apply-nav">
      ${!isFirst ? `<button class="btn btn--ghost apply-nav-back" id="apply-back-btn" aria-label="Previous question">
        ${icons.arrowRight} Back
      </button>` : '<span></span>'}
      <button class="btn btn--primary apply-nav-next" id="apply-next-btn">
        ${isLast ? 'Review Answers' : 'Next'} ${icons.arrowRight}
      </button>
    </div>
  `;

    // Animate out old step
    const oldStep = wrap.querySelector('.apply-step');
    if (oldStep) {
        oldStep.classList.add(direction === 'forward' ? 'exit-left' : 'exit-right');
        oldStep.addEventListener('animationend', () => oldStep.remove(), { once: true });
    }

    wrap.appendChild(newStep);

    // Trigger enter animation
    requestAnimationFrame(() => newStep.classList.add('apply-step--visible'));

    // Wire up inputs
    wireInputEvents(q);

    // Focus first input
    setTimeout(() => {
        const firstInput = newStep.querySelector('input, textarea, select, [role="radio"], [role="checkbox"]');
        if (firstInput) firstInput.focus();
    }, 300);

    // Wire nav buttons from within newStep so we attach to the current step,
    // not a stale one (getElementById returns first match; exiting step has pointer-events: none)
    const nextBtn = newStep.querySelector('#apply-next-btn');
    const backBtn = newStep.querySelector('#apply-back-btn');
    if (nextBtn) nextBtn.addEventListener('click', handleNext);
    if (backBtn) backBtn.addEventListener('click', handleBack);

    // Keyboard nav
    newStep.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            handleNext();
        }
    });
}

// ── Render input based on question type ────────────────────────────────────
function renderInput(q) {
    const val = state.answers[q.id];

    switch (q.type) {
        case 'text':
        case 'email':
        case 'tel':
        case 'url':
        case 'date':
            return `<input
          type="${q.type}"
          id="qinput-${q.id}"
          class="input apply-input"
          placeholder="${q.placeholder || ''}"
          value="${escapeHtml(val || '')}"
          ${q.required ? 'required' : ''}
          autocomplete="off"
        />`;

        case 'textarea':
            return `<textarea
          id="qinput-${q.id}"
          class="input apply-textarea"
          placeholder="${q.placeholder || ''}"
          rows="5"
          ${q.required ? 'required' : ''}
        >${escapeHtml(val || '')}</textarea>`;

        case 'select':
            return `<div class="apply-select-wrap">
          <select id="qinput-${q.id}" class="input apply-select" ${q.required ? 'required' : ''}>
            <option value="" ${!val ? 'selected' : ''} disabled>Select an option…</option>
            ${q.options.map(opt => `<option value="${escapeHtml(opt)}" ${val === opt ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
          <span class="apply-select-arrow">${icons.chevronDown}</span>
        </div>`;

        case 'radio':
            return `<div class="apply-options apply-options--radio" role="radiogroup" aria-label="${q.question}">
          ${q.options.map((opt, i) => `
            <label class="apply-option ${val === opt ? 'apply-option--selected' : ''}" for="qopt-${q.id}-${i}">
              <input
                type="radio"
                id="qopt-${q.id}-${i}"
                name="qinput-${q.id}"
                value="${escapeHtml(opt)}"
                class="apply-option__input sr-only"
                ${val === opt ? 'checked' : ''}
                ${q.required ? 'required' : ''}
              />
              <span class="apply-option__radio"></span>
              <span class="apply-option__label">${opt}</span>
            </label>
          `).join('')}
        </div>`;

        case 'checkbox': {
            const selected = Array.isArray(val) ? val : [];
            return `<div class="apply-options apply-options--checkbox" role="group" aria-label="${q.question}">
          ${q.options.map((opt, i) => `
            <label class="apply-option ${selected.includes(opt) ? 'apply-option--selected' : ''}" for="qopt-${q.id}-${i}">
              <input
                type="checkbox"
                id="qopt-${q.id}-${i}"
                name="qinput-${q.id}"
                value="${escapeHtml(opt)}"
                class="apply-option__input sr-only"
                ${selected.includes(opt) ? 'checked' : ''}
              />
              <span class="apply-option__checkbox"></span>
              <span class="apply-option__label">${opt}</span>
            </label>
          `).join('')}
        </div>`;
        }

        case 'checkbox_single': {
            const checked = Array.isArray(val) ? val.length > 0 : val === true;
            return `<div class="apply-options apply-options--checkbox" role="group">
          <label class="apply-option ${checked ? 'apply-option--selected' : ''}" for="qopt-${q.id}-0">
            <input
              type="checkbox"
              id="qopt-${q.id}-0"
              name="qinput-${q.id}"
              value="${escapeHtml(q.options[0])}"
              class="apply-option__input sr-only"
              ${checked ? 'checked' : ''}
              ${q.required ? 'required' : ''}
            />
            <span class="apply-option__checkbox"></span>
            <span class="apply-option__label">${q.options[0]}</span>
          </label>
        </div>`;
        }

        default:
            return `<input type="text" id="qinput-${q.id}" class="input apply-input" value="${escapeHtml(val || '')}" />`;
    }
}

// ── Wire input events (live answer collection + autosave) ───────────────────
function wireInputEvents(q) {
    const readValue = () => {
        switch (q.type) {
            case 'text':
            case 'email':
            case 'tel':
            case 'url':
            case 'date':
            case 'textarea':
            case 'select': {
                const el = document.getElementById(`qinput-${q.id}`);
                return el ? el.value : '';
            }
            case 'radio': {
                const checked = document.querySelector(`input[name="qinput-${q.id}"]:checked`);
                return checked ? checked.value : '';
            }
            case 'checkbox': {
                const checked = document.querySelectorAll(`input[name="qinput-${q.id}"]:checked`);
                return Array.from(checked).map(c => c.value);
            }
            case 'checkbox_single': {
                const el = document.querySelector(`input[name="qinput-${q.id}"]`);
                return el?.checked ? [el.value] : [];
            }
            default:
                return '';
        }
    };

    const onChange = () => {
        const val = readValue();
        state.answers[q.id] = val;
        scheduleAutosave();
        // Update option highlight
        updateOptionHighlights(q);
        // Hide error
        const errEl = document.getElementById('apply-field-error');
        if (errEl) errEl.textContent = '';
    };

    const container = document.getElementById('apply-step-wrap');
    container?.querySelectorAll(`[name="qinput-${q.id}"]`).forEach(el => {
        el.addEventListener('change', onChange);
        el.addEventListener('input', onChange);
    });
    const singleEl = document.getElementById(`qinput-${q.id}`);
    if (singleEl) {
        singleEl.addEventListener('input', onChange);
        singleEl.addEventListener('change', onChange);
    }
}

function updateOptionHighlights(q) {
    if (q.type === 'radio') {
        const checked = document.querySelector(`input[name="qinput-${q.id}"]:checked`);
        document.querySelectorAll(`input[name="qinput-${q.id}"]`).forEach(inp => {
            inp.closest('.apply-option')?.classList.toggle('apply-option--selected', inp === checked);
        });
    } else if (q.type === 'checkbox' || q.type === 'checkbox_single') {
        document.querySelectorAll(`input[name="qinput-${q.id}"]`).forEach(inp => {
            inp.closest('.apply-option')?.classList.toggle('apply-option--selected', inp.checked);
        });
    }
}

// ── Validate current answer ─────────────────────────────────────────────────
function validateCurrent() {
    const steps = getSteps();
    const q = steps[state.currentStep];
    if (!q) return true;

    const val = state.answers[q.id];
    if (!q.required) return true;

    if (q.type === 'checkbox' || q.type === 'checkbox_single') {
        return Array.isArray(val) && val.length > 0;
    }
    if (q.type === 'checkbox_single') {
        return Array.isArray(val) && val.length > 0;
    }

    // maxSelect validation for checkboxes
    if (q.type === 'checkbox' && q.maxSelect && Array.isArray(val)) {
        if (val.length > q.maxSelect) {
            showFieldError(`Please select at most ${q.maxSelect} options.`);
            return false;
        }
    }

    return val !== undefined && val !== '' && val !== null;
}

function showFieldError(msg) {
    const el = document.getElementById('apply-field-error');
    if (el) el.textContent = msg;
}

// ── Navigation ──────────────────────────────────────────────────────────────
function handleNext() {
    if (!validateCurrent()) {
        const steps = getSteps();
        const q = steps[state.currentStep];
        if (q?.type === 'checkbox' && q.maxSelect) {
            // error already shown
        } else {
            showFieldError('This question is required. Please provide an answer before continuing.');
        }
        // Shake animation
        document.querySelector('.apply-step')?.classList.add('apply-shake');
        setTimeout(() => document.querySelector('.apply-step')?.classList.remove('apply-shake'), 500);
        return;
    }

    // Re-compute steps after potential conditional changes
    const steps = getSteps();

    if (state.currentStep >= steps.length - 1) {
        state.isReview = true;
        autosave();
        renderReviewScreen();
    } else {
        state.currentStep++;
        autosave();
        renderStep('forward');
    }
}

function handleBack() {
    if (state.isReview) {
        state.isReview = false;
        renderStep('back');
        return;
    }
    if (state.currentStep > 0) {
        state.currentStep--;
        renderStep('back');
    }
}

// ── Review Screen ───────────────────────────────────────────────────────────
function renderReviewScreen() {
    const wrap = document.getElementById('apply-step-wrap');
    if (!wrap) return;

    updateProgress();

    const sections = getQuestionsBySection(state.answers);

    const sectionsHtml = sections.map(sec => `
    <div class="review-section">
      <h3 class="review-section__title">
        <span class="review-section__letter">${sec.id}</span>
        ${sec.title}
        <button class="btn btn--ghost btn--sm review-edit-btn" data-section="${sec.id}" aria-label="Edit section ${sec.title}">
          ${icons.edit} Edit
        </button>
      </h3>
      <div class="review-section__answers">
        ${sec.questions.map(q => {
        const val = state.answers[q.id];
        const displayVal = formatAnswerForReview(q, val);
        return `
          <div class="review-answer" data-qid="${q.id}">
            <span class="review-answer__label">${q.question.replace(' *', '')}</span>
            <span class="review-answer__value ${!displayVal ? 'review-answer__value--empty'  : ''}">${displayVal || '<em>Not answered</em>'}</span>
          </div>
        `;
    }).join('')}
      </div>
    </div>
  `).join('');

    // Check required fields
    const activeQs = getActiveQuestions(state.answers);
    const missing = activeQs.filter(q => {
        if (!q.required) return false;
        const val = state.answers[q.id];
        if (q.type === 'checkbox' || q.type === 'checkbox_single') return !Array.isArray(val) || val.length === 0;
        return !val;
    });

    const reviewHtml = `
    <div class="apply-review apply-step apply-step--enter-right apply-step--visible">
      <div class="review-header glass-card">
        <h2 class="review-header__title">Review Your Application</h2>
        <p class="review-header__subtitle">Check everything before submitting. You can edit any section.</p>
        ${missing.length > 0 ? `
          <div class="review-warning">
            ${icons.bell}
            <span>${missing.length} required question${missing.length > 1 ? 's are' : ' is'} unanswered. Please complete them before submitting.</span>
          </div>
        ` : `
          <div class="review-ready">
            ${icons.check}
            <span>All required questions answered. Ready to submit!</span>
          </div>
        `}
      </div>

      <div class="review-sections">
        ${sectionsHtml}
      </div>

      <div class="apply-nav apply-nav--review">
        <button class="btn btn--ghost" id="apply-back-btn">
          ${icons.arrowRight} Back to Edit
        </button>
        <button class="btn btn--primary btn--lg apply-submit-btn" id="apply-submit-btn" ${missing.length > 0 ? 'disabled' : ''}>
          Submit Application ${icons.arrowRight}
        </button>
      </div>

      <p class="review-submit-note">Once submitted, you cannot edit your application.</p>
    </div>
  `;

    wrap.innerHTML = reviewHtml;

    // Wire edit buttons — jump to first question of that section
    document.querySelectorAll('.review-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.dataset.section;
            const steps = getSteps();
            const firstInSection = steps.findIndex(q => q.section === sectionId);
            if (firstInSection >= 0) {
                state.currentStep = firstInSection;
                state.isReview = false;
                renderStep('back');
            }
        });
    });

    document.getElementById('apply-back-btn')?.addEventListener('click', handleBack);
    document.getElementById('apply-submit-btn')?.addEventListener('click', handleSubmit);
}

function formatAnswerForReview(q, val) {
    if (val === undefined || val === null || val === '') return '';
    if (Array.isArray(val)) return val.join(', ') || '';
    return String(val);
}

// ── Submit ──────────────────────────────────────────────────────────────────
async function handleSubmit() {
    const submitBtn = document.getElementById('apply-submit-btn');
    if (!submitBtn || submitBtn.disabled) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="auth-spinner"></span> Submitting…`;

    try {
        const { error } = await supabase
            .from('applications')
            .update({
                status: 'submitted',
                answers: state.answers,
                submitted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', state.applicationId);

        if (error) throw error;

        state.isSubmitted = true;
        renderSuccessScreen();
        showToast('Application submitted successfully!', 'success');
    } catch (err) {
        console.error('[Apply] Submit error:', err);
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Submit Application ${icons.arrowRight}`;
        showToast('Submission failed. Please try again.', 'error');
    }
}

// ── Success screen ──────────────────────────────────────────────────────────
function renderSuccessScreen() {
    const wrap = document.getElementById('apply-step-wrap');
    if (!wrap) return;

    const bar = document.getElementById('apply-progress-bar');
    if (bar) bar.style.width = '100%';

    wrap.innerHTML = `
    <div class="apply-success glass-card">
      <div class="apply-success__icon">${icons.check}</div>
      <h2>Application Submitted!</h2>
      <p>Thank you for applying to HackCI. We'll review your application and get back to you by email.</p>
      <p class="text-muted">Your status is now <strong>Under Review</strong>. Check your dashboard for updates.</p>
      <a href="#/dashboard" class="btn btn--primary btn--lg">Go to Dashboard ${icons.arrowRight}</a>
    </div>
  `;
}

function renderSubmittedState(status) {
    const wrap = document.getElementById('apply-step-wrap');
    if (!wrap) return;

    const bar = document.getElementById('apply-progress-bar');
    if (bar) bar.style.width = '100%';

    wrap.innerHTML = `
    <div class="apply-success glass-card">
      <div class="apply-success__icon">${icons.check}</div>
      <h2>Application Already Submitted</h2>
      <p>Your application status is currently <strong>${formatStatus(status)}</strong>.</p>
      <p class="text-muted">You cannot make changes after submitting. Check your dashboard for the latest update.</p>
      <a href="#/dashboard" class="btn btn--primary btn--lg">Go to Dashboard ${icons.arrowRight}</a>
    </div>
  `;
}

function formatStatus(status) {
    const map = {
        draft: 'Draft',
        submitted: 'Submitted',
        under_review: 'Under Review',
        accepted: 'Accepted',
        rejected: 'Not Selected',
        waitlisted: 'Waitlisted',
    };
    return map[status] || status;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
