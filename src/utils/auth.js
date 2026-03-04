// ============================================
// Auth Utility — Supabase-backed
// ============================================
import { supabase } from './supabase.js';

// Module-level cached user. Populated by resolveSession().
let _currentUser = null;

/**
 * Resolves the current Supabase session and fetches the profile.
 * Call this at the start of every route change in the router.
 */
export async function resolveSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            // Profile row may be missing on first OAuth sign-in (trigger race).
            // Create a minimal placeholder so the rest of the app doesn't crash.
            if (!profile) {
                await _bootstrapProfile(session.user);
                return resolveSession();
            }

            const { data: application } = await supabase
                .from('applications')
                .select('status')
                .eq('user_id', session.user.id)
                .single();

            _currentUser = {
                id: session.user.id,
                email: session.user.email,
                ...profile,
                applicationStatus: application?.status ?? null,
            };
        } else {
            _currentUser = null;
        }
    } catch {
        _currentUser = null;
    }
    return _currentUser;
}

/** Sync — safe to call after resolveSession() has been awaited. */
export function isAuthenticated() {
    return _currentUser !== null;
}

/** Sync — returns true if current user has admin or super_admin role. */
export function isAdmin() {
    return _currentUser?.role === 'admin' || _currentUser?.role === 'super_admin';
}

/** Sync — returns true if current user has application status = 'accepted'. */
export function isAccepted() {
    return _currentUser?.applicationStatus === 'accepted';
}

/** Sync — returns cached user object (or null). */
export function getUser() {
    return _currentUser;
}

/**
 * Sign in with email + password.
 * Resolves session after login so isAuthenticated() is immediately correct.
 */
export async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await resolveSession();
    return data;
}

/**
 * Create a new account. Also inserts a profiles row.
 */
export async function register(email, password, firstName, lastName) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { first_name: firstName, last_name: lastName },
        },
    });
    if (error) throw error;

    // Insert profile row (trigger also does this, but front-end ensures it exists immediately)
    if (data.user) {
        await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            role: 'applicant',
        }, { onConflict: 'id', ignoreDuplicates: true });
    }

    await resolveSession();
    return data;
}

/**
 * Initiate Google OAuth sign-in.
 * Redirects the browser — nothing after this call executes.
 * The router handles the callback when the user returns to the app.
 */
export async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/',
        },
    });
    if (error) throw error;
    return data;
}

/**
 * Ensures a profile row exists for the authenticated user.
 * Called after the OAuth callback in case the DB trigger was slow or missed.
 * Also fills in first/last name from Google metadata if they are still empty.
 */
export async function ensureProfile() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null;

        const user = session.user;
        const meta = user.user_metadata || {};

        const { data: existing } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .eq('id', user.id)
            .single();

        if (!existing) {
            // Profile trigger didn't fire — create it now
            await supabase.from('profiles').upsert({
                id: user.id,
                email: user.email,
                first_name: _extractFirstName(meta),
                last_name: _extractLastName(meta),
                role: 'applicant',
            }, { onConflict: 'id', ignoreDuplicates: false });
        } else if (!existing.first_name && !existing.last_name) {
            // Profile exists but name is empty (trigger ran before Google metadata arrived)
            const firstName = _extractFirstName(meta);
            const lastName = _extractLastName(meta);
            if (firstName || lastName) {
                await supabase.from('profiles')
                    .update({ first_name: firstName, last_name: lastName })
                    .eq('id', user.id);
            }
        }

        return resolveSession();
    } catch {
        return resolveSession();
    }
}

/**
 * Sign out and clear cached user.
 */
export async function logout() {
    await supabase.auth.signOut();
    _currentUser = null;
}

/**
 * Locally update cached user fields (does NOT write to DB).
 * Use for optimistic UI updates.
 */
export function updateUser(data) {
    if (_currentUser) {
        _currentUser = { ..._currentUser, ...data };
    }
    return _currentUser;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _extractFirstName(meta) {
    return (
        meta.first_name?.trim() ||
        meta.given_name?.trim() ||
        meta.full_name?.split(' ')[0]?.trim() ||
        meta.name?.split(' ')[0]?.trim() ||
        ''
    );
}

function _extractLastName(meta) {
    const full = (meta.full_name || meta.name || '').trim();
    return (
        meta.last_name?.trim() ||
        meta.family_name?.trim() ||
        (full.includes(' ') ? full.split(' ').slice(1).join(' ') : '') ||
        ''
    );
}

async function _bootstrapProfile(user) {
    const meta = user.user_metadata || {};
    await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        first_name: _extractFirstName(meta),
        last_name: _extractLastName(meta),
        role: 'applicant',
    }, { onConflict: 'id', ignoreDuplicates: true });
}
