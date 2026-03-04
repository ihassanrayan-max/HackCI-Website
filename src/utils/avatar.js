// ============================================
// Avatar helpers: initials, deterministic color, public URL, HTML
// ============================================
import { supabase } from './supabase.js';

const AVATAR_BUCKET = 'avatars';

/** Deterministic color from user ID (consistent across sessions) */
const COLOR_PALETTE = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e',
    '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#2563eb',
];

export function getInitialsFromName(displayName) {
    if (!displayName || typeof displayName !== 'string') return '?';
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Get initials from first + last name (for admin/forms) */
export function getInitials(firstName, lastName) {
    const f = (firstName || '?')[0];
    const l = (lastName || '?')[0];
    return `${f}${l}`.toUpperCase();
}

/** Deterministic hue index from UUID string */
export function getAvatarColor(userId) {
    if (!userId) return COLOR_PALETTE[0];
    let hash = 0;
    const str = typeof userId === 'string' ? userId : String(userId);
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    const index = Math.abs(hash) % COLOR_PALETTE.length;
    return COLOR_PALETTE[index];
}

/** Public URL for an avatar path (avatars bucket) */
export function getAvatarPublicUrl(avatarPath) {
    if (!avatarPath) return null;
    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(avatarPath);
    return data?.publicUrl || null;
}

/**
 * Build avatar HTML: image with onerror fallback to initials circle.
 * @param {Object} opts - { avatarPath, userId, displayName, sizeClass = 'avatar', alt }
 * @param {function} escapeHtml - (str) => safe HTML string
 * @returns HTML string
 */
export function buildAvatarHtml(opts, escapeHtml) {
    const { avatarPath, userId, displayName, sizeClass = 'avatar', alt = 'Profile' } = opts;
    const initials = getInitialsFromName(displayName || '');
    const color = getAvatarColor(userId);
    const safeAlt = escapeHtml ? escapeHtml(alt) : String(alt).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const url = avatarPath ? getAvatarPublicUrl(avatarPath) : null;
    const safeUrl = url && escapeHtml ? escapeHtml(url) : (url || '');
    const imgHtml = url
        ? `<img src="${safeUrl}" alt="${safeAlt}" class="avatar-img" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><span class="avatar-initials" style="display:none;background:${color}" aria-hidden="true">${escapeHtml ? escapeHtml(initials) : initials}</span>`
        : `<span class="avatar-initials" style="background:${color}" aria-hidden="true">${escapeHtml ? escapeHtml(initials) : initials}</span>`;

    return `<span class="avatar ${sizeClass}" role="img" aria-label="${safeAlt}">${imgHtml}</span>`;
}
