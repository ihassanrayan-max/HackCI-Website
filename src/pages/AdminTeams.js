// ============================================
// Admin Teams — View, create, assign, disband teams
// ============================================
import { supabase } from '../utils/supabase.js';
import { icons } from '../assets/icons.js';
import { showToast } from '../utils/toast.js';
import { Modal } from '../components/Modal.js';
import { SKILLS_OPTIONS } from '../data/applicationQuestions.js';

const TEAM_MAX = 4;

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function visibleName(profile, answers = {}) {
    const preferred = answers?.preferred_name?.trim();
    if (preferred) return escapeHtml(preferred);
    const first = profile?.first_name || answers?.legal_first_name || '';
    const last = profile?.last_name || answers?.legal_last_name || '';
    const lastInitial = last ? ` ${last.charAt(0)}.` : '';
    return escapeHtml((first + lastInitial).trim() || 'Anonymous');
}

function schoolMajorYear(answers) {
    const parts = [];
    if (answers?.school_name) parts.push(answers.school_name);
    if (answers?.program) parts.push(answers.program);
    if (answers?.year_of_study) parts.push(answers.year_of_study);
    return parts.length ? parts.join(' · ') : null;
}

export function renderAdminTeams() {
    return `
    <div class="admin-page">
      <section class="page-hero" style="padding-bottom: var(--sp-4);">
        <div class="container"></div>
      </section>
      <section class="section admin-section">
        <div class="container container--wide">
          <div class="admin-header">
            <div>
              <h1 class="admin-header__title">Teams</h1>
              <p class="admin-header__subtitle" id="admin-teams-count">Loading teams…</p>
            </div>
            <div class="admin-header__actions">
              <a href="#/admin" class="btn btn--ghost btn--sm">${icons.arrowRight} Back to Admin</a>
              <button class="btn btn--primary btn--sm" id="admin-teams-create-btn">
                ${icons.users} Create Team
              </button>
            </div>
          </div>
          <div class="admin-stats" id="admin-teams-stats"></div>
          <div class="admin-table-wrap glass-card">
            <div id="admin-teams-table">
              <div class="admin-loading">
                <div class="admin-spinner"></div>
                <p>Loading teams…</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export async function initAdminTeams() {
    await loadTeams();
    document.getElementById('admin-teams-create-btn')?.addEventListener('click', openCreateTeamModal);
}

async function loadTeams() {
    const tableEl = document.getElementById('admin-teams-table');
    const statsEl = document.getElementById('admin-teams-stats');
    const countEl = document.getElementById('admin-teams-count');
    if (!tableEl) return;

    try {
        const { data: teams } = await supabase.from('teams').select('id, name, description, owner_id, created_at');
        if (!teams?.length) {
            tableEl.innerHTML = '<div class="admin-empty"><p>No teams yet.</p></div>';
            statsEl.innerHTML = renderStats(0, 0, 0);
            if (countEl) countEl.textContent = '0 teams';
            return;
        }

        const ownerIds = [...new Set(teams.map((t) => t.owner_id))];
        const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name').in('id', ownerIds);
        const profileMap = {};
        (profiles || []).forEach((p) => (profileMap[p.id] = p));

        const { data: members } = await supabase.from('team_members').select('team_id, user_id');
        const countMap = {};
        (members || []).forEach((m) => {
            countMap[m.team_id] = (countMap[m.team_id] || 0) + 1;
        });

        const totalPlaced = Object.values(countMap).reduce((a, b) => a + b, 0);
        const atCapacity = Object.values(countMap).filter((c) => c >= TEAM_MAX).length;

        const rows = teams.map((t) => {
            const owner = profileMap[t.owner_id];
            const ownerName = owner ? `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || '—' : '—';
            const mc = countMap[t.id] || 0;
            return { ...t, member_count: mc, owner_name: ownerName };
        });

        statsEl.innerHTML = renderStats(teams.length, totalPlaced, atCapacity);
        if (countEl) countEl.textContent = `${teams.length} teams`;
        tableEl.innerHTML = renderTeamsTable(rows);
        attachTableListeners(tableEl, rows);
    } catch (err) {
        console.error('[AdminTeams] Load error:', err);
        tableEl.innerHTML = '<div class="admin-empty"><p>Failed to load teams.</p></div>';
    }
}

function renderStats(totalTeams, totalPlaced, atCapacity) {
    return `
    <div class="admin-stat glass-card">
      <span class="admin-stat__num">${totalTeams}</span>
      <span class="admin-stat__label">Teams</span>
    </div>
    <div class="admin-stat glass-card">
      <span class="admin-stat__num">${totalPlaced}</span>
      <span class="admin-stat__label">Placed</span>
    </div>
    <div class="admin-stat glass-card">
      <span class="admin-stat__num">${atCapacity}</span>
      <span class="admin-stat__label">At Capacity</span>
    </div>
  `;
}

function renderTeamsTable(teams) {
    return `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Team Name</th>
          <th>Members</th>
          <th>Owner</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${teams
            .map(
                (t) => `
          <tr data-team-id="${t.id}">
            <td>${escapeHtml(t.name)}</td>
            <td>${t.member_count}/${TEAM_MAX}</td>
            <td>${escapeHtml(t.owner_name)}</td>
            <td>
              <button class="btn btn--ghost btn--sm admin-teams-view" data-team-id="${t.id}">View</button>
              <button class="btn btn--ghost btn--sm admin-teams-disband" data-team-id="${t.id}">Disband</button>
            </td>
          </tr>
        `
            )
            .join('')}
      </tbody>
    </table>
  `;
}

function attachTableListeners(tableEl, teams) {
    tableEl.querySelectorAll('.admin-teams-view').forEach((btn) => {
        btn.addEventListener('click', () => {
            const teamId = btn.dataset.teamId;
            const team = teams.find((t) => t.id === teamId);
            if (team) openTeamDetailModal(team);
        });
    });
    tableEl.querySelectorAll('.admin-teams-disband').forEach((btn) => {
        btn.addEventListener('click', () => {
            const teamId = btn.dataset.teamId;
            const team = teams.find((t) => t.id === teamId);
            if (team) handleDisband(team);
        });
    });
}

async function openTeamDetailModal(team) {
    const { data: members } = await supabase
        .from('team_members')
        .select('user_id, joined_at')
        .eq('team_id', team.id)
        .order('joined_at');

    if (!members?.length) {
        Modal.open(`
      <div class="modal__close-wrap"><button class="modal__close" data-modal-close>${icons.close}</button></div>
      <h3 class="modal__title">${escapeHtml(team.name)}</h3>
      <p class="text-muted">No members.</p>
      <div class="admin-teams-modal-actions">
        <button class="btn btn--primary btn--sm" id="admin-teams-assign-btn" data-team-id="${team.id}">Assign Member</button>
      </div>
    `);
        document.getElementById('admin-teams-assign-btn')?.addEventListener('click', () => {
            Modal.close();
            openAssignMemberModal(team);
        });
        return;
    }

    const memberIds = members.map((m) => m.user_id);
    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name').in('id', memberIds);
    const { data: apps } = await supabase.from('applications').select('user_id, answers').in('user_id', memberIds);
    const profileMap = {};
    (profiles || []).forEach((p) => (profileMap[p.id] = p));
    const appMap = {};
    (apps || []).forEach((a) => (appMap[a.user_id] = a.answers || {}));

    const memberRows = members
        .map(
            (m) => `
      <div class="admin-teams-member-row" data-user-id="${m.user_id}">
        <div>
          <strong>${visibleName(profileMap[m.user_id], appMap[m.user_id])}</strong>
          ${team.owner_id === m.user_id ? ' <span class="badge badge--accepted">Owner</span>' : ''}
        </div>
        <div class="admin-teams-member-meta">
          ${schoolMajorYear(appMap[m.user_id]) ? escapeHtml(schoolMajorYear(appMap[m.user_id])) : '—'}
        </div>
        <div class="admin-teams-member-meta">
          ${appMap[m.user_id]?.skill_level ? escapeHtml(appMap[m.user_id].skill_level) : '—'}
        </div>
        <button class="btn btn--ghost btn--sm admin-teams-remove" data-user-id="${m.user_id}" data-team-id="${team.id}">Remove</button>
      </div>
    `
        )
        .join('');

    const canAssign = members.length < TEAM_MAX;

    const html = `
    <div class="modal__close-wrap"><button class="modal__close" data-modal-close>${icons.close}</button></div>
    <h3 class="modal__title">${escapeHtml(team.name)}</h3>
    <p class="text-muted">${members.length}/${TEAM_MAX} members</p>
    <div class="admin-teams-members-list">${memberRows}</div>
    <div class="admin-teams-modal-actions">
      ${canAssign ? `<button class="btn btn--primary btn--sm" id="admin-teams-assign-btn" data-team-id="${team.id}">Assign Member</button>` : ''}
    </div>
  `;
    Modal.open(html);

    document.querySelectorAll('.admin-teams-remove').forEach((btn) => {
        btn.addEventListener('click', () => {
            const userId = btn.dataset.userId;
            const teamId = btn.dataset.teamId;
            handleRemoveMember(teamId, userId);
        });
    });
    document.getElementById('admin-teams-assign-btn')?.addEventListener('click', () => {
        Modal.close();
        openAssignMemberModal(team);
    });
}

async function handleRemoveMember(teamId, userId) {
    const { error } = await supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', userId);
    if (error) {
        showToast('Failed to remove member.', 'error');
        return;
    }
    showToast('Member removed.', 'success');
    Modal.close();
    await loadTeams();
}

async function handleDisband(team) {
    if (!confirm(`Disband "${team.name}"? This will remove all members.`)) return;
    const { error } = await supabase.from('teams').delete().eq('id', team.id);
    if (error) {
        showToast('Failed to disband team.', 'error');
        return;
    }
    showToast('Team disbanded.', 'success');
    await loadTeams();
}

async function openAssignMemberModal(team) {
    const { data: currentMembers } = await supabase.from('team_members').select('user_id').eq('team_id', team.id);
    const currentIds = new Set((currentMembers || []).map((m) => m.user_id));

    const { data: accepted } = await supabase
        .from('applications')
        .select('user_id')
        .eq('status', 'accepted');

    const acceptedIds = new Set((accepted || []).map((a) => a.user_id));
    const { data: inTeams } = await supabase.from('team_members').select('user_id');
    const inTeamIds = new Set((inTeams || []).map((m) => m.user_id));

    const availableIds = [...acceptedIds].filter((id) => !currentIds.has(id) && !inTeamIds.has(id));

    if (!availableIds.length) {
        showToast('No accepted participants available to assign.', 'info');
        return;
    }

    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, email').in('id', availableIds);
    const { data: apps } = await supabase.from('applications').select('user_id, answers').in('user_id', availableIds);
    const appMap = {};
    (apps || []).forEach((a) => (appMap[a.user_id] = a.answers || {}));

    const options = (profiles || [])
        .map((p) => {
            const name = visibleName(p, appMap[p.id]);
            const school = schoolMajorYear(appMap[p.id]);
            const label = school ? `${name} (${school})` : name;
            return `<option value="${p.id}">${label}</option>`;
        })
        .join('');

    const html = `
    <div class="modal__close-wrap"><button class="modal__close" data-modal-close>${icons.close}</button></div>
    <h3 class="modal__title">Assign to ${escapeHtml(team.name)}</h3>
    <form id="admin-teams-assign-form">
      <label class="input-group">
        <span>Select participant</span>
        <select name="user_id" class="input" required>${options}</select>
      </label>
      <div class="modal__actions">
        <button type="button" class="btn btn--ghost" data-modal-close>Cancel</button>
        <button type="submit" class="btn btn--primary">Assign</button>
      </div>
    </form>
  `;
    Modal.open(html);

    document.getElementById('admin-teams-assign-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = e.target.querySelector('[name="user_id"]').value;
        const { count } = await supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('team_id', team.id);
        if (count >= TEAM_MAX) {
            showToast('Team is full.', 'error');
            return;
        }
        const { error } = await supabase.from('team_members').insert({ team_id: team.id, user_id: userId });
        if (error) {
            showToast(error.message || 'Failed to assign.', 'error');
            return;
        }
        Modal.close();
        showToast('Member assigned.', 'success');
        await loadTeams();
    });
}

async function openCreateTeamModal() {
    const rolesHtml = SKILLS_OPTIONS.map(
        (s) =>
            `<label class="team-hub-chip"><input type="checkbox" name="roles" value="${escapeHtml(s)}" /> ${escapeHtml(s)}</label>`
    ).join('');

    const { data: accepted } = await supabase.from('applications').select('user_id').eq('status', 'accepted');
    const acceptedIds = (accepted || []).map((a) => a.user_id);
    const { data: inTeams } = await supabase.from('team_members').select('user_id');
    const inTeamIds = new Set((inTeams || []).map((m) => m.user_id));
    const availableIds = acceptedIds.filter((id) => !inTeamIds.has(id));

    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name').in('id', availableIds);
    const { data: apps } = await supabase.from('applications').select('user_id, answers').in('user_id', availableIds);
    const appMap = {};
    (apps || []).forEach((a) => (appMap[a.user_id] = a.answers || {}));

    const memberOptions =
        (profiles || []).length > 0
            ? (profiles || [])
                  .map((p) => {
                      const name = visibleName(p, appMap[p.id]);
                      return `<option value="${p.id}">${name}</option>`;
                  })
                  .join('')
            : '<option value="">No accepted participants available</option>';

    const html = `
    <div class="modal__close-wrap"><button class="modal__close" data-modal-close>${icons.close}</button></div>
    <h3 class="modal__title">Create Team</h3>
    <form id="admin-teams-create-form" class="admin-teams-create-form">
      <label class="input-group">
        <span>Team name</span>
        <input type="text" name="name" class="input" required placeholder="e.g. Code Crushers" />
      </label>
      <label class="input-group">
        <span>Description</span>
        <textarea name="description" class="input" rows="2"></textarea>
      </label>
      <div class="input-group">
        <span>Roles wanted (optional)</span>
        <div class="team-hub-chips">${rolesHtml}</div>
      </div>
      <label class="input-group">
        <span>Add members (max ${TEAM_MAX})</span>
        <select name="members" class="input" multiple size="4">
          ${memberOptions}
        </select>
        <small class="text-muted">Hold Ctrl/Cmd to select multiple</small>
      </label>
      <div class="modal__actions">
        <button type="button" class="btn btn--ghost" data-modal-close>Cancel</button>
        <button type="submit" class="btn btn--primary">Create</button>
      </div>
    </form>
  `;
    Modal.open(html);

    document.getElementById('admin-teams-create-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const name = form.querySelector('[name="name"]').value.trim();
        const description = form.querySelector('[name="description"]').value.trim();
        const roles = Array.from(form.querySelectorAll('[name="roles"]:checked')).map((c) => c.value);
        const memberIds = Array.from(form.querySelector('[name="members"]').selectedOptions).map((o) => o.value);

        if (!name) {
            showToast('Team name is required.', 'error');
            return;
        }
        if (memberIds.length > TEAM_MAX) {
            showToast(`Maximum ${TEAM_MAX} members allowed.`, 'error');
            return;
        }

        const ownerId = memberIds[0] || null;
        if (!ownerId) {
            showToast('At least one member is required as owner.', 'error');
            return;
        }

        const { data: team, error: teamErr } = await supabase
            .from('teams')
            .insert({ name, description, roles_wanted: roles, owner_id: ownerId })
            .select('id')
            .single();

        if (teamErr) {
            showToast(teamErr.message || 'Failed to create team.', 'error');
            return;
        }

        const inserts = memberIds.map((userId) => ({ team_id: team.id, user_id: userId }));
        const { error: memberErr } = await supabase.from('team_members').insert(inserts);
        if (memberErr) {
            showToast('Team created but some members could not be added.', 'error');
            await loadTeams();
            Modal.close();
            return;
        }

        Modal.close();
        showToast('Team created.', 'success');
        await loadTeams();
    });
}
