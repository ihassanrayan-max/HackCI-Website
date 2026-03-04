// ============================================
// Admin Dashboard — Application List & Filters
// ============================================
import { supabase } from '../utils/supabase.js';
import { icons } from '../assets/icons.js';
import { showToast } from '../utils/toast.js';
import { TRACKS, CANADIAN_PROVINCES } from '../data/applicationQuestions.js';
import { buildRows, toCsv, downloadCsv, trackExported } from '../utils/exportCsv.js';
import { buildAvatarHtml } from '../utils/avatar.js';

const STATUSES = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'waitlisted', label: 'Waitlisted' },
];

const STATUS_CLASSES = {
    draft: 'badge--draft',
    submitted: 'badge--submitted',
    under_review: 'badge--review',
    accepted: 'badge--accepted',
    rejected: 'badge--rejected',
    waitlisted: 'badge--waitlisted',
};

let _allApps = [];
let _selectedIds = new Set();
let _filterState = {
    search: '',
    status: '',
    track: '',
    province: '',
    beginner: false,
};

export function renderAdminDashboard() {
    return `
    <div class="admin-page">
      <section class="page-hero" style="padding-bottom: var(--sp-4);">
        <div class="container"></div>
      </section>
      <section class="section admin-section">
        <div class="container container--wide">

          <!-- Header -->
          <div class="admin-header">
            <div>
              <h1 class="admin-header__title">Admin Dashboard</h1>
              <p class="admin-header__subtitle" id="admin-app-count">Loading applications…</p>
            </div>
            <div class="admin-header__actions">
              <a href="#/admin/teams" class="btn btn--ghost btn--sm">${icons.users} Teams</a>
              <button class="btn btn--ghost btn--sm" id="admin-refresh-btn">
                ${icons.sparkles} Refresh
              </button>
              <div class="export-toolbar glass-card">
                <select id="export-mode" class="input input--sm">
                  <option value="filtered">Export current filters</option>
                  <option value="selected">Export selected (0)</option>
                  <option value="not_reviewed">Export not reviewed yet</option>
                  <option value="not_exported">Export not previously exported</option>
                </select>
                <label class="export-pii-toggle">
                  <input type="checkbox" id="export-exclude-pii" />
                  <span>Exclude PII</span>
                </label>
                <button id="export-btn" class="btn btn--primary btn--sm">Export CSV</button>
              </div>
            </div>
          </div>

          <!-- Stats Row -->
          <div class="admin-stats" id="admin-stats">
            <!-- Populated by JS -->
          </div>

          <!-- Filters + Search -->
          <div class="admin-filters glass-card">
            <div class="admin-search-wrap">
              <span class="admin-search-icon">${icons.search}</span>
              <input
                type="search"
                id="admin-search"
                class="input admin-search"
                placeholder="Search by name, email, or school…"
                aria-label="Search applicants"
              />
            </div>
            <div class="admin-filter-row">
              <select id="filter-status" class="input admin-filter-select">
                ${STATUSES.map(s => `<option value="${s.value}">${s.label}</option>`).join('')}
              </select>
              <select id="filter-track" class="input admin-filter-select">
                <option value="">All Tracks</option>
                ${TRACKS.map(t => `<option value="${t}">${t}</option>`).join('')}
              </select>
              <select id="filter-province" class="input admin-filter-select">
                <option value="">All Provinces</option>
                ${CANADIAN_PROVINCES.map(p => `<option value="${p}">${p}</option>`).join('')}
              </select>
              <label class="admin-filter-checkbox">
                <input type="checkbox" id="filter-beginner" />
                <span>Beginners only</span>
              </label>
              <button class="btn btn--ghost btn--sm" id="admin-clear-filters">Clear</button>
            </div>
          </div>

          <!-- Table -->
          <div class="admin-table-wrap glass-card">
            <div id="admin-table-container">
              <div class="admin-loading">
                <div class="admin-spinner"></div>
                <p>Loading applicants…</p>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  `;
}

export async function initAdminDashboard() {
    await loadApplications();

    // Wire search
    document.getElementById('admin-search')?.addEventListener('input', debounce(() => {
        _filterState.search = document.getElementById('admin-search').value.toLowerCase().trim();
        renderTable();
    }, 250));

    // Wire filters
    ['filter-status', 'filter-track', 'filter-province'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => {
            _filterState.status = document.getElementById('filter-status')?.value || '';
            _filterState.track = document.getElementById('filter-track')?.value || '';
            _filterState.province = document.getElementById('filter-province')?.value || '';
            renderTable();
        });
    });

    document.getElementById('filter-beginner')?.addEventListener('change', (e) => {
        _filterState.beginner = e.target.checked;
        renderTable();
    });

    document.getElementById('admin-clear-filters')?.addEventListener('click', () => {
        _filterState = { search: '', status: '', track: '', province: '', beginner: false };
        document.getElementById('admin-search').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-track').value = '';
        document.getElementById('filter-province').value = '';
        document.getElementById('filter-beginner').checked = false;
        renderTable();
    });

    document.getElementById('admin-refresh-btn')?.addEventListener('click', async () => {
        await loadApplications();
        showToast('Refreshed', 'success');
    });

    wireExportHandlers();
}

function wireExportHandlers() {
    const container = document.getElementById('admin-table-container');
    const exportModeSelect = document.getElementById('export-mode');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    const exportBtn = document.getElementById('export-btn');

    if (container) {
        container.addEventListener('change', (e) => {
            const cb = e.target.closest('.row-checkbox');
            if (cb) {
                const id = cb.dataset.id;
                if (cb.checked) _selectedIds.add(id);
                else _selectedIds.delete(id);
                updateSelectAllState();
                updateExportModeLabel();
            }
        });
        container.addEventListener('click', (e) => {
            if (e.target.closest('.row-checkbox')) e.stopPropagation();
        });
    }

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', () => {
            const filtered = getFilteredApps();
            if (selectAllCheckbox.checked) {
                filtered.forEach(a => _selectedIds.add(a.id));
            } else {
                filtered.forEach(a => _selectedIds.delete(a.id));
            }
            renderTable();
            updateExportModeLabel();
        });
    }

    if (exportModeSelect) {
        exportModeSelect.addEventListener('change', updateExportModeLabel);
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', handleExport);
    }

    updateExportModeLabel();
}

function updateSelectAllState() {
    const selectAll = document.getElementById('select-all-checkbox');
    if (!selectAll) return;
    const filtered = getFilteredApps();
    const filteredIds = new Set(filtered.map(a => a.id));
    const selectedCount = [..._selectedIds].filter(id => filteredIds.has(id)).length;
    selectAll.checked = filtered.length > 0 && selectedCount === filtered.length;
    selectAll.indeterminate = selectedCount > 0 && selectedCount < filtered.length;
}

function updateExportModeLabel() {
    const opt = document.querySelector('#export-mode option[value="selected"]');
    if (opt) opt.textContent = `Export selected (${_selectedIds.size})`;
}

async function handleExport() {
    const mode = document.getElementById('export-mode')?.value || 'filtered';
    const excludePii = document.getElementById('export-exclude-pii')?.checked ?? false;
    const exportBtn = document.getElementById('export-btn');

    let sourceApps;
    if (mode === 'filtered') {
        sourceApps = getFilteredApps();
    } else if (mode === 'selected') {
        sourceApps = _allApps.filter(a => _selectedIds.has(a.id));
    } else if (mode === 'not_reviewed') {
        sourceApps = _allApps.filter(a => !a.review?.decision);
    } else {
        sourceApps = _allApps.filter(a => !a.exported_at);
    }

    if (!sourceApps.length) {
        showToast('Nothing to export', 'info');
        return;
    }

    exportBtn?.classList.add('export-btn-loading');
    exportBtn?.setAttribute('disabled', 'true');

    try {
        const rows = buildRows(sourceApps, { excludePii });
        const csv = toCsv(rows);
        const suffix = excludePii ? '_no_pii' : '';
        const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        downloadCsv(csv, `applications_export${suffix}_${yyyymmdd}.csv`);
        await trackExported(sourceApps.map(a => a.id));
        const ts = new Date().toISOString();
        sourceApps.forEach(a => {
            const app = _allApps.find(x => x.id === a.id);
            if (app) app.exported_at = ts;
        });
        showToast(`Exported ${sourceApps.length} application${sourceApps.length !== 1 ? 's' : ''}`, 'success');
    } catch (err) {
        console.error('[Export]', err);
        showToast('Export failed: ' + (err.message || 'Unknown error'), 'error');
    } finally {
        exportBtn?.classList.remove('export-btn-loading');
        exportBtn?.removeAttribute('disabled');
    }
}

async function loadApplications() {
    try {
        const { data, error } = await supabase
            .from('applications')
            .select(`
                id,
                status,
                answers,
                submitted_at,
                exported_at,
                created_at,
                updated_at,
                profiles!applications_user_id_fkey (
                    id, first_name, last_name, email, avatar_path
                ),
                admin_reviews (
                    decision, score, tags, notes, admin_id, created_at, updated_at
                )
            `)
            .order('submitted_at', { ascending: false, nullsFirst: false });

        if (error) throw error;

        _allApps = (data || []).map(app => ({
            ...app,
            profile: app.profiles,
            review: app.admin_reviews?.[0] || null,
        }));

        renderStats();
        renderTable();

        const count = _allApps.filter(a => a.status !== 'draft').length;
        const countEl = document.getElementById('admin-app-count');
        if (countEl) countEl.textContent = `${count} application${count !== 1 ? 's' : ''} received`;

    } catch (err) {
        console.error('[Admin] Load error:', err);
        const container = document.getElementById('admin-table-container');
        if (container) {
            container.innerHTML = `<div class="admin-error">Failed to load applications. ${err.message}</div>`;
        }
    }
}

function renderStats() {
    const statsEl = document.getElementById('admin-stats');
    if (!statsEl) return;

    const counts = {
        total: _allApps.filter(a => a.status !== 'draft').length,
        submitted: _allApps.filter(a => a.status === 'submitted').length,
        under_review: _allApps.filter(a => a.status === 'under_review').length,
        accepted: _allApps.filter(a => a.status === 'accepted').length,
        rejected: _allApps.filter(a => a.status === 'rejected').length,
        waitlisted: _allApps.filter(a => a.status === 'waitlisted').length,
    };

    statsEl.innerHTML = Object.entries({
        'Total Applications': counts.total,
        'Submitted': counts.submitted,
        'Under Review': counts.under_review,
        'Accepted': counts.accepted,
        'Rejected': counts.rejected,
        'Waitlisted': counts.waitlisted,
    }).map(([label, count]) => `
    <div class="admin-stat glass-card">
      <span class="admin-stat__num">${count}</span>
      <span class="admin-stat__label">${label}</span>
    </div>
  `).join('');
}

function getFilteredApps() {
    return _allApps.filter(app => {
        const answers = app.answers || {};
        const profile = app.profile || {};

        // Hide pure drafts from main list (they haven't started)
        if (app.status === 'draft' && _filterState.status !== 'draft') {
            // Still show drafts if explicitly filtering for them
            if (_filterState.status === '') return false;
        }

        // Search
        if (_filterState.search) {
            const name = `${profile.first_name || ''} ${profile.last_name || ''} ${answers.preferred_name || ''}`.toLowerCase();
            const email = (profile.email || '').toLowerCase();
            const school = (answers.school_name || '').toLowerCase();
            if (!name.includes(_filterState.search) && !email.includes(_filterState.search) && !school.includes(_filterState.search)) {
                return false;
            }
        }

        // Status filter (when explicitly set)
        if (_filterState.status && app.status !== _filterState.status) return false;

        // Track filter
        if (_filterState.track) {
            const tracks = answers.tracks || [];
            if (!tracks.includes(_filterState.track)) return false;
        }

        // Province filter
        if (_filterState.province && answers.province !== _filterState.province) return false;

        // Beginner filter
        if (_filterState.beginner) {
            const level = answers.skill_level || '';
            if (!level.toLowerCase().includes('beginner')) return false;
        }

        return true;
    });
}

function renderTable() {
    const container = document.getElementById('admin-table-container');
    if (!container) return;

    const filtered = getFilteredApps();

    if (filtered.length === 0) {
        container.innerHTML = `
      <div class="admin-empty">
        ${icons.search}
        <p>No applications match your filters.</p>
      </div>`;
        return;
    }

    container.innerHTML = `
    <div class="admin-table-scroll">
      <table class="admin-table">
        <thead>
          <tr>
            <th class="admin-col-check">
              <input type="checkbox" id="select-all-checkbox" aria-label="Select all" />
            </th>
            <th>Applicant</th>
            <th>School / Background</th>
            <th>Province</th>
            <th>Submitted</th>
            <th>Status</th>
            <th>Tags</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(app => renderTableRow(app)).join('')}
        </tbody>
      </table>
    </div>
    <div class="admin-table-footer">
      Showing ${filtered.length} of ${_allApps.length} applicants
    </div>
  `;

    updateSelectAllState();

    // Wire row clicks
    container.querySelectorAll('[data-app-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.hash = `#/admin/application/${btn.dataset.appId}`;
        });
    });
}

function renderTableRow(app) {
    const profile = app.profile || {};
    const answers = app.answers || {};
    const review = app.review;

    const firstName = answers.legal_first_name || profile.first_name || '—';
    const lastName = answers.legal_last_name || profile.last_name || '';
    const preferredName = answers.preferred_name ? ` (${answers.preferred_name})` : '';
    const fullName = `${firstName} ${lastName}${preferredName}`.trim();
    const email = profile.email || '—';
    const school = answers.school_name || '—';
    const background = answers.background || '—';
    const province = answers.province || '—';
    const status = app.status || 'draft';
    const statusClass = STATUS_CLASSES[status] || '';
    const statusLabel = formatStatus(status);
    const tags = review?.tags || [];
    const submittedAt = app.submitted_at
        ? new Date(app.submitted_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
        : '—';

    const avatarHtml = buildAvatarHtml(
        { avatarPath: profile.avatar_path, userId: profile.id, displayName: `${firstName} ${lastName}`.trim() || '—', sizeClass: 'avatar--sm' },
        escapeHtml
    );

    return `
    <tr class="admin-table__row">
      <td class="admin-table__cell admin-col-check">
        <input type="checkbox" class="row-checkbox" data-id="${app.id}"
          ${_selectedIds.has(app.id) ? 'checked' : ''} />
      </td>
      <td class="admin-table__cell admin-table__cell--name">
        <div class="admin-applicant">
          <div class="admin-applicant__avatar">${avatarHtml}</div>
          <div>
            <div class="admin-applicant__name">${escapeHtml(fullName)}</div>
            <div class="admin-applicant__email">${escapeHtml(email)}</div>
          </div>
        </div>
      </td>
      <td class="admin-table__cell">
        <div>${escapeHtml(school)}</div>
        <div class="admin-table__sub">${escapeHtml(background)}</div>
      </td>
      <td class="admin-table__cell">${escapeHtml(province)}</td>
      <td class="admin-table__cell">${submittedAt}</td>
      <td class="admin-table__cell">
        <span class="badge ${statusClass}">${statusLabel}</span>
      </td>
      <td class="admin-table__cell">
        <div class="admin-tags">
          ${tags.slice(0, 3).map(tag => `<span class="admin-tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
      </td>
      <td class="admin-table__cell">
        <button class="btn btn--ghost btn--sm" data-app-id="${app.id}">
          Review ${icons.arrowRight}
        </button>
      </td>
    </tr>
  `;
}

function getInitials(first, last) {
    return `${(first || '?')[0]}${(last || '?')[0]}`.toUpperCase();
}

function formatStatus(status) {
    const map = {
        draft: 'Draft',
        submitted: 'Submitted',
        under_review: 'Under Review',
        accepted: 'Accepted',
        rejected: 'Rejected',
        waitlisted: 'Waitlisted',
    };
    return map[status] || status;
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}
