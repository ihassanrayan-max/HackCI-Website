// ============================================
// Team Hub — Participant-facing team management
// ============================================
import { icons } from '../assets/icons.js';
import { getUser } from '../utils/auth.js';
import { supabase } from '../utils/supabase.js';
import { showToast } from '../utils/toast.js';
import { Modal } from '../components/Modal.js';
import { SKILLS_OPTIONS } from '../data/applicationQuestions.js';
import { buildAvatarHtml } from '../utils/avatar.js';

const TEAM_MAX = 4;

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Build school/major/year string from RPC profile */
function schoolMajorYearFromRpc(p) {
    const parts = [];
    if (p?.school) parts.push(p.school);
    if (p?.major) parts.push(p.major);
    if (p?.year) parts.push(p.year);
    return parts.length ? parts.join(' · ') : null;
}

/** Normalize phone/WhatsApp to digits only for comparison */
function normalizePhone(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/\D/g, '');
}

/**
 * Phone vs WhatsApp de-duplication (team view only).
 * Returns { showWhatsApp, showPhone, whatsappHref, whatsappTitle, phoneHref, phoneTitle }.
 */
function getPhoneWhatsAppDisplay(p) {
    const wa = (p?.whatsapp || '').trim();
    const phone = (p?.contact_phone || '').trim();
    const waDigits = normalizePhone(wa);
    const phoneDigits = normalizePhone(phone);
    const sameNumber = waDigits && phoneDigits && waDigits === phoneDigits;

    const showWhatsApp = !!wa;
    const showPhone = !!phone && (!waDigits || !sameNumber);

    return {
        showWhatsApp,
        showPhone,
        whatsappHref: wa ? `https://wa.me/${waDigits}` : '',
        whatsappTitle: wa ? `WhatsApp: ${wa}` : '',
        phoneHref: phone ? `tel:${phone.replace(/\s/g, '')}` : '',
        phoneTitle: phone ? `Call: ${phone}` : '',
    };
}

/** Render a profile card (member or requester). p = RPC row; showContact = is_teammate (after joining). */
function renderProfileCard(p, options = {}) {
    if (!p) return '<div class="team-hub-member-card"><div class="team-hub-member-name">Anonymous</div></div>';
    const { isOwner = false, showContact = false, requestId = null, requestUserId = null } = options;
    const schoolYear = schoolMajorYearFromRpc(p);

    const avatarHtml = buildAvatarHtml(
        { avatarPath: p.avatar_path, userId: p.user_id, displayName: p.display_name, sizeClass: 'avatar--md' },
        escapeHtml
    );

    // Social: Discord + Instagram — icon-only, no usernames (shown when we have them; RPC hides when not teammate)
    const hasSocial = p.discord || p.instagram;
    const socialHtml = hasSocial
        ? `
        <div class="team-hub-member-social">
          ${p.discord ? `<a href="https://discord.com" target="_blank" rel="noopener" title="Discord" class="team-hub-social-icon">${icons.discord}</a>` : ''}
          ${p.instagram ? `<a href="https://instagram.com/${escapeHtml((p.instagram || '').replace(/^@/, ''))}" target="_blank" rel="noopener" title="Instagram" class="team-hub-social-icon">${icons.instagram}</a>` : ''}
        </div>
      `
        : '';

    // Contact: Phone/WhatsApp — only after joining (showContact), de-duplicated, icon-only
    const contact = getPhoneWhatsAppDisplay(p);
    const hasContact = showContact && (contact.showWhatsApp || contact.showPhone);
    const contactHtml = hasContact
        ? `
        <div class="team-hub-member-contact">
          ${contact.showWhatsApp ? `<a href="${escapeHtml(contact.whatsappHref)}" target="_blank" rel="noopener" title="${escapeHtml(contact.whatsappTitle)}" class="team-hub-contact-icon">${icons.whatsapp}</a>` : ''}
          ${contact.showPhone ? `<a href="${escapeHtml(contact.phoneHref)}" title="${escapeHtml(contact.phoneTitle)}" class="team-hub-contact-icon">${icons.phone}</a>` : ''}
        </div>
      `
        : '';

    const actionsHtml = requestId && requestUserId
        ? `
        <div class="team-hub-request-actions">
          <button class="btn btn--primary btn--sm" data-action="approve" data-request-id="${requestId}" data-user-id="${requestUserId}">Approve</button>
          <button class="btn btn--ghost btn--sm" data-action="deny" data-request-id="${requestId}">Deny</button>
        </div>
      `
        : '';
    return `
      <div class="team-hub-member-card" ${requestId ? `data-request-id="${requestId}" data-user-id="${requestUserId}"` : ''}>
        <div class="team-hub-member-header">
          ${avatarHtml}
          <div class="team-hub-member-info">
            <div class="team-hub-member-name">
              ${escapeHtml(p.display_name || 'Anonymous')}
              ${isOwner ? ' <span class="team-hub-owner-badge">Owner</span>' : ''}
            </div>
            ${schoolYear ? `<div class="team-hub-member-school">${escapeHtml(schoolYear)}</div>` : ''}
            ${p.experience ? `<div class="team-hub-member-exp">${escapeHtml(p.experience)}</div>` : ''}
          </div>
        </div>
        <div class="team-hub-member-links">
          ${p.github ? `<a href="${escapeHtml(p.github)}" target="_blank" rel="noopener" title="GitHub">${icons.github}</a>` : ''}
          ${p.linkedin ? `<a href="${escapeHtml(p.linkedin)}" target="_blank" rel="noopener" title="LinkedIn">${icons.linkedin}</a>` : ''}
          ${p.portfolio ? `<a href="${escapeHtml(p.portfolio)}" target="_blank" rel="noopener" title="Portfolio">Portfolio</a>` : ''}
        </div>
        ${socialHtml}
        ${contactHtml}
        ${actionsHtml}
      </div>
    `;
}

export function renderTeamHub() {
    return `
    <div class="team-hub-page">
      <section class="page-hero" style="padding-bottom: var(--sp-4);">
        <div class="container"></div>
      </section>
      <section class="section team-hub-section">
        <div class="container container--wide">
          <div class="team-hub-header">
            <h1 class="team-hub-title">Team Hub</h1>
            <p class="team-hub-subtitle">Create a team, browse open teams, or manage your current team.</p>
          </div>
          <div class="team-hub-content" id="team-hub-content">
            <div class="team-hub-loading">
              <div class="loading-spinner"></div>
              <p>Loading…</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export async function initTeamHub() {
    const user = getUser();
    if (!user) return;

    const content = document.getElementById('team-hub-content');
    if (!content) return;

    try {
        const [myMembership, teamsWithCount, myPendingRequests] = await Promise.all([
            supabase.from('team_members').select('team_id, joined_at').eq('user_id', user.id).maybeSingle(),
            fetchTeamsWithMemberCount(),
            supabase.from('join_requests').select('team_id').eq('user_id', user.id).eq('status', 'pending'),
        ]);

        const myTeamId = myMembership.data?.team_id ?? null;
        const pendingTeamIds = new Set((myPendingRequests.data || []).map((r) => r.team_id));

        if (myTeamId) {
            content.innerHTML = renderMyTeamPlaceholder();
            await loadMyTeamView(content, myTeamId, user.id);
        } else {
            content.innerHTML = renderNoTeamView(teamsWithCount, pendingTeamIds);
            attachNoTeamListeners(content, user.id, pendingTeamIds);
        }
    } catch (err) {
        console.error('[TeamHub] Init error:', err);
        content.innerHTML = `
      <div class="team-hub-error glass-card">
        <p>Could not load Team Hub. Please refresh the page.</p>
        <button class="btn btn--primary" onclick="window.location.reload()">Retry</button>
      </div>
    `;
    }
}

async function fetchTeamsWithMemberCount() {
    const { data: teams } = await supabase.from('teams').select('id, name, description, roles_wanted, owner_id');
    if (!teams?.length) return [];

    const { data: counts } = await supabase.from('team_members').select('team_id');
    const countMap = {};
    (counts || []).forEach((row) => {
        countMap[row.team_id] = (countMap[row.team_id] || 0) + 1;
    });

    return teams.map((t) => ({
        ...t,
        member_count: countMap[t.id] || 0,
        is_full: (countMap[t.id] || 0) >= TEAM_MAX,
    }));
}

function renderNoTeamView(teams, pendingTeamIds) {
    const openTeams = teams.filter((t) => !t.is_full);

    return `
    <div class="team-hub-no-team">
      <div class="team-hub-create glass-card">
        <h3 class="team-hub-card-title">${icons.users} Create a Team</h3>
        <p class="team-hub-card-desc">Start your own team and invite others to join.</p>
        <button class="btn btn--primary" id="team-hub-create-btn">
          Create Team ${icons.arrowRight}
        </button>
      </div>

      <div class="team-hub-browse">
        <h3 class="team-hub-section-title">Browse Open Teams</h3>
        <div class="team-hub-grid" id="team-hub-grid">
          ${openTeams.length ? openTeams.map((t) => renderTeamCard(t, pendingTeamIds)).join('') : `
            <div class="team-hub-empty glass-card">
              <p class="text-muted">No open teams yet. Be the first to create one!</p>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

function renderTeamCard(team, pendingTeamIds) {
    const hasPending = pendingTeamIds.has(team.id);
    const rolesStr = (team.roles_wanted || []).length ? (team.roles_wanted || []).join(', ') : '—';
    return `
    <div class="team-card glass-card" data-team-id="${team.id}">
      <div class="team-card__header">
        <h4 class="team-card__name">${escapeHtml(team.name)}</h4>
        <span class="team-card__count">${team.member_count}/${TEAM_MAX}</span>
      </div>
      <p class="team-card__desc">${escapeHtml(team.description || '—')}</p>
      <p class="team-card__roles"><strong>Roles wanted:</strong> ${escapeHtml(rolesStr)}</p>
      <button class="btn btn--secondary btn--sm team-card__request" data-team-id="${team.id}"
        ${hasPending ? 'disabled' : ''}>
        ${hasPending ? 'Requested' : 'Request to Join'}
      </button>
    </div>
  `;
}

function renderMyTeamPlaceholder() {
    return `<div class="team-hub-loading"><div class="loading-spinner"></div><p>Loading your team…</p></div>`;
}

async function loadMyTeamView(content, teamId, userId) {
    const { data: team } = await supabase.from('teams').select('*').eq('id', teamId).single();
    if (!team) {
        content.innerHTML = '<div class="team-hub-error glass-card"><p>Team not found.</p></div>';
        return;
    }

    const { data: members } = await supabase
        .from('team_members')
        .select('user_id, joined_at')
        .eq('team_id', teamId)
        .order('joined_at');

    const memberIds = (members || []).map((m) => m.user_id);

    const { data: rpcProfiles } = await supabase.rpc('get_team_visible_profiles', { p_user_ids: memberIds });
    const profileMap = {};
    (rpcProfiles || []).forEach((p) => (profileMap[p.user_id] = p));

    const memberList = (members || [])
        .sort((a, b) => new Date(a.joined_at) - new Date(b.joined_at))
        .map((m) => ({
            ...m,
            profile: profileMap[m.user_id],
        }));

    const isOwner = team.owner_id === userId;

    let pendingRequestsHtml = '';
    if (isOwner) {
        const { data: requests } = await supabase
            .from('join_requests')
            .select('id, user_id, created_at')
            .eq('team_id', teamId)
            .eq('status', 'pending');

        if (requests?.length) {
            const reqUserIds = requests.map((r) => r.user_id);
            const { data: reqRpcProfiles } = await supabase.rpc('get_team_visible_profiles', { p_user_ids: reqUserIds });
            const reqProfileMap = {};
            (reqRpcProfiles || []).forEach((p) => (reqProfileMap[p.user_id] = p));

            const requestCards = requests
                .map((r) => {
                    const p = reqProfileMap[r.user_id];
                    return renderProfileCard(p, {
                        isOwner: false,
                        showContact: false,
                        requestId: r.id,
                        requestUserId: r.user_id,
                    });
                })
                .join('');

            pendingRequestsHtml = `
        <div class="team-hub-requests glass-card">
          <h4 class="team-hub-card-title">Pending Join Requests</h4>
          <div class="team-hub-request-list" id="team-hub-request-list">
            ${requestCards}
          </div>
        </div>
      `;
        }
    }

    const rolesStr = (team.roles_wanted || []).length ? (team.roles_wanted || []).join(', ') : '—';

    const memberCards = memberList
        .map((m) => {
            const p = m.profile;
            return renderProfileCard(p, {
                isOwner: team.owner_id === m.user_id,
                showContact: p?.is_teammate ?? true,
            });
        })
        .join('');

    content.innerHTML = `
    <div class="team-hub-my-team">
      <div class="team-hub-team-detail glass-card">
        <div class="team-hub-team-header">
          <h3 class="team-hub-team-name">${escapeHtml(team.name)}</h3>
          <span class="team-hub-team-badge">${memberList.length}/${TEAM_MAX} members</span>
        </div>
        <p class="team-hub-team-desc">${escapeHtml(team.description || '—')}</p>
        <p class="team-hub-team-roles"><strong>Roles wanted:</strong> ${escapeHtml(rolesStr)}</p>
        <div class="team-hub-members">
          <h4 class="team-hub-card-title">Members</h4>
          <div class="team-hub-member-list" id="team-hub-member-list">
            ${memberCards}
          </div>
        </div>
        <button class="btn btn--ghost btn--sm team-hub-leave" id="team-hub-leave-btn">Leave Team</button>
      </div>
      ${pendingRequestsHtml}
    </div>
  `;

    attachMyTeamListeners(content, teamId, userId, isOwner, memberList);
}

function attachMyTeamListeners(content, teamId, userId, isOwner, memberList) {
    const leaveBtn = content.querySelector('#team-hub-leave-btn');
    if (leaveBtn) {
        leaveBtn.addEventListener('click', () => handleLeaveTeam(teamId, userId, isOwner, memberList));
    }

    content.querySelectorAll('[data-action="approve"]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const requestId = btn.dataset.requestId || btn.closest('[data-request-id]')?.dataset?.requestId;
            const requestUserId = btn.dataset.userId || btn.closest('[data-user-id]')?.dataset?.userId;
            if (requestId && requestUserId) handleApproveRequest(requestId, teamId, requestUserId);
        });
    });

    content.querySelectorAll('[data-action="deny"]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const requestId = btn.dataset.requestId || btn.closest('[data-request-id]')?.dataset?.requestId;
            if (requestId) handleDenyRequest(requestId);
        });
    });
}

async function handleApproveRequest(requestId, teamId, requestUserId) {
    const { data: team } = await supabase.from('teams').select('id').eq('id', teamId).single();
    if (!team) return;

    const { count } = await supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('team_id', teamId);
    if (count >= TEAM_MAX) {
        showToast('Team is already full. Cannot add more members.', 'error');
        return;
    }

    const { error: updErr } = await supabase.from('join_requests').update({ status: 'approved' }).eq('id', requestId);
    if (updErr) {
        showToast('Failed to approve request.', 'error');
        return;
    }

    const { error: insErr } = await supabase.from('team_members').insert({ team_id: teamId, user_id: requestUserId });
    if (insErr) {
        showToast('Failed to add member.', 'error');
        return;
    }

    showToast('Request approved. Member added to team.', 'success');
    window.location.hash = '#/teams';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
}

async function handleDenyRequest(requestId) {
    const { error } = await supabase.from('join_requests').update({ status: 'denied' }).eq('id', requestId);
    if (error) {
        showToast('Failed to deny request.', 'error');
        return;
    }
    showToast('Request denied.', 'info');
    window.location.hash = '#/teams';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
}

async function handleLeaveTeam(teamId, userId, isOwner, memberList) {
    const otherMembers = memberList.filter((m) => m.user_id !== userId);

    if (isOwner && otherMembers.length === 0) {
        showToast('You are the only member. Only an admin can disband the team. Please ask an admin if you need to leave.', 'info');
        return;
    }

    if (!confirm('Are you sure you want to leave this team?')) return;

    if (isOwner && otherMembers.length > 0) {
        const nextOwner = otherMembers[0];
        const { error: updErr } = await supabase.from('teams').update({ owner_id: nextOwner.user_id }).eq('id', teamId);
        if (updErr) {
            showToast('Failed to transfer ownership.', 'error');
            return;
        }
    }

    const { error } = await supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', userId);
    if (error) {
        showToast('Failed to leave team.', 'error');
        return;
    }
    // Remove join_request so user can request to join again later
    await supabase.from('join_requests').delete().eq('team_id', teamId).eq('user_id', userId);
    showToast('You have left the team.', 'success');
    window.location.hash = '#/teams';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function attachNoTeamListeners(content, userId, pendingTeamIds) {
    const createBtn = content.querySelector('#team-hub-create-btn');
    if (createBtn) {
        createBtn.addEventListener('click', () => openCreateTeamModal(userId));
    }

    content.querySelectorAll('.team-card__request').forEach((btn) => {
        if (btn.disabled) return;
        btn.addEventListener('click', () => {
            const teamId = btn.dataset.teamId;
            if (teamId) requestToJoin(teamId, userId);
        });
    });
}

function openCreateTeamModal(userId) {
    const rolesHtml = SKILLS_OPTIONS.map(
        (s) =>
            `<label class="team-hub-chip"><input type="checkbox" name="roles" value="${escapeHtml(s)}" /> ${escapeHtml(s)}</label>`
    ).join('');

    const html = `
    <div class="modal__close-wrap">
      <button class="modal__close" data-modal-close>${icons.close}</button>
    </div>
    <h3 class="modal__title">Create a Team</h3>
    <form id="team-hub-create-form" class="team-hub-form">
      <label class="input-group">
        <span>Team name</span>
        <input type="text" name="name" class="input" required placeholder="e.g. Code Crushers" />
      </label>
      <label class="input-group">
        <span>Short description</span>
        <textarea name="description" class="input" rows="3" placeholder="What's your team about?"></textarea>
      </label>
      <div class="input-group">
        <span>Roles / skills wanted (optional)</span>
        <div class="team-hub-chips">${rolesHtml}</div>
      </div>
      <div class="modal__actions">
        <button type="button" class="btn btn--ghost" data-modal-close>Cancel</button>
        <button type="submit" class="btn btn--primary">Create Team</button>
      </div>
    </form>
  `;
    Modal.open(html);

    document.getElementById('team-hub-create-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const name = form.querySelector('[name="name"]').value.trim();
        const description = form.querySelector('[name="description"]').value.trim();
        const roles = Array.from(form.querySelectorAll('[name="roles"]:checked')).map((c) => c.value);

        if (!name) {
            showToast('Team name is required.', 'error');
            return;
        }

        const { data: team, error: teamErr } = await supabase
            .from('teams')
            .insert({ name, description, roles_wanted: roles, owner_id: userId })
            .select('id')
            .single();

        if (teamErr) {
            showToast(teamErr.message || 'Failed to create team.', 'error');
            return;
        }

        const { error: memberErr } = await supabase.from('team_members').insert({ team_id: team.id, user_id: userId });
        if (memberErr) {
            showToast('Team created but failed to add you. Please try again.', 'error');
            return;
        }

        Modal.close();
        showToast('Team created! You are the owner.', 'success');
        window.location.hash = '#/teams';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
}

async function requestToJoin(teamId, userId) {
    const { count } = await supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('team_id', teamId);
    if (count >= TEAM_MAX) {
        showToast('This team is full.', 'error');
        return;
    }

    const { error } = await supabase.from('join_requests').insert({ team_id: teamId, user_id: userId, status: 'pending' });
    if (error) {
        if (error.code === '23505') {
            showToast('You already have a pending request for this team.', 'info');
        } else {
            showToast('Failed to send request.', 'error');
        }
        return;
    }
    showToast('Join request sent. The team owner will review it.', 'success');
    window.location.hash = '#/teams';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
}
