// ============================================
// Profile Page
// Persists to Supabase: profiles (first_name, last_name, avatar_path) + applications.answers
// ============================================
import { icons } from '../assets/icons.js';
import { getUser, updateUser, resolveSession } from '../utils/auth.js';
import { supabase } from '../utils/supabase.js';
import { showToast } from '../utils/toast.js';
import { getInitialsFromName, getAvatarColor, getAvatarPublicUrl } from '../utils/avatar.js';

const AVATAR_BUCKET = 'avatars';
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPT_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Option sets aligned with application question IDs for consistent storage
const YEAR_OPTIONS = ['1st year', '2nd year', '3rd year', '4th year', '5th year+', 'Graduate (Masters)', 'Graduate (PhD)', 'Other'];
const DIETARY_OPTIONS = ['None', 'Halal', 'Vegetarian', 'Vegan', 'Gluten-free', 'Kosher', 'Nut allergy', 'Other — I\'ll specify in accessibility field'];
const EXPERIENCE_OPTIONS = ['Never — this is my first!', '1–2', '3–5', '6+'];

function refreshAvatarPreview(userId, avatarPath, firstName, lastName) {
    const initialsEl = document.getElementById('profile-avatar-initials');
    const imgEl = document.getElementById('profile-avatar-img');
    if (!initialsEl || !imgEl) return;
    const displayName = [firstName, lastName].filter(Boolean).join(' ');
    initialsEl.textContent = getInitialsFromName(displayName || '?');
    initialsEl.style.background = getAvatarColor(userId);
    if (avatarPath) {
        const url = getAvatarPublicUrl(avatarPath);
        imgEl.src = url || '';
        imgEl.style.display = url ? 'block' : 'none';
        initialsEl.style.display = url ? 'none' : 'flex';
        imgEl.onerror = () => {
            imgEl.style.display = 'none';
            initialsEl.style.display = 'flex';
        };
    } else {
        imgEl.src = '';
        imgEl.style.display = 'none';
        initialsEl.style.display = 'flex';
    }
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function renderProfile() {
    const user = getUser() || {};
    const firstName = escapeHtml(user.first_name || user.name?.split(' ')[0] || '');
    const lastName = escapeHtml(user.last_name || user.name?.split(' ')[1] || '');
    const email = escapeHtml(user.email || '');

    const yearOptionsHtml = YEAR_OPTIONS.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
    const dietaryOptionsHtml = DIETARY_OPTIONS.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
    const experienceOptionsHtml = EXPERIENCE_OPTIONS.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');

    return `
    <div class="profile-page">
      <section class="page-hero" style="padding-bottom: var(--sp-4);">
        <div class="container"></div>
      </section>
      <section class="section profile-section">
        <div class="container container--narrow">
          <div class="profile__header">
            <h1 class="profile__title">Your Profile</h1>
            <p class="profile__subtitle">Complete your participant information. Changes are saved to your account.</p>
          </div>

          <form class="profile-form" id="profile-form" novalidate>
            <!-- Profile Picture (optional) -->
            <div class="profile-form__section glass-card">
              <h2 class="profile-form__section-title">${icons.user} Profile Picture</h2>
              <p class="profile-form__helper">Optional. You may upload a photo or avatar. It does not need to be your real photo.</p>
              <div class="profile-form__avatar-wrap">
                <div class="profile-form__avatar-preview" id="profile-avatar-preview" role="img" aria-label="Profile preview">
                  <span class="avatar avatar--lg avatar-initials" id="profile-avatar-initials" style="background: var(--avatar-bg, #6366f1)"></span>
                  <img id="profile-avatar-img" class="avatar-img avatar--lg" alt="Profile" style="display: none;" />
                </div>
                <div class="profile-form__avatar-actions">
                  <label class="btn btn--secondary btn--sm">
                    <input type="file" id="profile-avatar-input" accept="image/jpeg,image/png,image/webp" class="profile-form__avatar-input" />
                    Upload photo
                  </label>
                  <button type="button" class="btn btn--ghost btn--sm" id="profile-avatar-remove">Remove</button>
                </div>
              </div>
            </div>

            <!-- Personal Info -->
            <div class="profile-form__section glass-card">
              <h2 class="profile-form__section-title">${icons.user} Personal Information</h2>
              <div class="grid grid--2">
                <div class="input-group">
                  <label for="profile-fname">First Name *</label>
                  <input type="text" id="profile-fname" name="firstName" class="input" placeholder="Alex" value="${firstName}" required />
                </div>
                <div class="input-group">
                  <label for="profile-lname">Last Name *</label>
                  <input type="text" id="profile-lname" name="lastName" class="input" placeholder="Johnson" value="${lastName}" required />
                </div>
              </div>
              <div class="grid grid--2">
                <div class="input-group">
                  <label for="profile-email">Email Address</label>
                  <input type="email" id="profile-email" name="email" class="input" value="${email}" disabled />
                </div>
                <div class="input-group">
                  <label for="profile-phone">Phone Number</label>
                  <input type="tel" id="profile-phone" name="phone" class="input" placeholder="+1 (555) 123-4567" />
                </div>
              </div>
            </div>

            <!-- Education -->
            <div class="profile-form__section glass-card">
              <h2 class="profile-form__section-title">${icons.globe} Education</h2>
              <div class="input-group">
                <label for="profile-school">School / University *</label>
                <input type="text" id="profile-school" name="school" class="input" placeholder="Stanford University" required />
              </div>
              <div class="grid grid--2">
                <div class="input-group">
                  <label for="profile-major">Major / Field of Study</label>
                  <input type="text" id="profile-major" name="major" class="input" placeholder="Computer Science" />
                </div>
                <div class="input-group">
                  <label for="profile-year">Year of Study</label>
                  <select id="profile-year" name="year" class="input">
                    <option value="">Select year</option>
                    ${yearOptionsHtml}
                  </select>
                </div>
              </div>
            </div>

            <!-- Links -->
            <div class="profile-form__section glass-card">
              <h2 class="profile-form__section-title">${icons.code} Links & Experience</h2>
              <div class="grid grid--2">
                <div class="input-group">
                  <label for="profile-github">GitHub URL</label>
                  <input type="url" id="profile-github" name="github" class="input" placeholder="https://github.com/username" />
                </div>
                <div class="input-group">
                  <label for="profile-linkedin">LinkedIn URL</label>
                  <input type="url" id="profile-linkedin" name="linkedin" class="input" placeholder="https://linkedin.com/in/username" />
                </div>
              </div>
              <div class="input-group">
                <label for="profile-portfolio">Portfolio / Website</label>
                <input type="url" id="profile-portfolio" name="portfolio" class="input" placeholder="https://yoursite.com" />
              </div>
            </div>

            <!-- Hackathon Details -->
            <div class="profile-form__section glass-card">
              <h2 class="profile-form__section-title">${icons.sparkles} Hackathon Details</h2>
              <div class="grid grid--2">
                <div class="input-group">
                  <label for="profile-dietary">Dietary Restrictions</label>
                  <select id="profile-dietary" name="dietary" class="input">
                    <option value="">Select</option>
                    ${dietaryOptionsHtml}
                  </select>
                </div>
                <div class="input-group">
                  <label for="profile-tshirt">T-Shirt Size</label>
                  <select id="profile-tshirt" name="tshirtSize" class="input">
                    <option value="">Select size</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>
              </div>
              <div class="input-group">
                <label for="profile-why">Why do you want to attend HackCI? *</label>
                <textarea id="profile-why" name="motivation" class="input" placeholder="Tell us what excites you about this hackathon and what you hope to build or learn..." required></textarea>
              </div>
              <div class="input-group">
                <label for="profile-experience">Hackathon Experience Level</label>
                <select id="profile-experience" name="experience" class="input">
                  <option value="">Select experience level</option>
                  ${experienceOptionsHtml}
                </select>
              </div>
            </div>

            <!-- Team Hub Visibility -->
            <div class="profile-form__section glass-card">
              <h2 class="profile-form__section-title">${icons.users} Team Hub Visibility</h2>
              <label class="profile-checkbox-group">
                <input type="checkbox" id="profile-anonymous" name="anonymousInTeams" />
                <span>Hide my name in Team Hub (shown as Anonymous). Not recommended — fewer people may select you.</span>
              </label>
              <div class="profile-form__teammate-contact">
                <p class="profile-form__helper">Share with teammates so you can coordinate. Only visible after you join a team.</p>
                <div class="grid grid--2">
                  <div class="input-group">
                    <label for="profile-discord">Discord Username</label>
                    <input type="text" id="profile-discord" name="discord" class="input" placeholder="username#1234" />
                  </div>
                  <div class="input-group">
                    <label for="profile-instagram">Instagram Handle</label>
                    <input type="text" id="profile-instagram" name="instagram" class="input" placeholder="@username" />
                  </div>
                </div>
                <div class="input-group">
                  <label for="profile-whatsapp">WhatsApp Number</label>
                  <input type="tel" id="profile-whatsapp" name="whatsapp" class="input" placeholder="+1 (555) 123-4567" />
                </div>
              </div>
            </div>

            <!-- Submit -->
            <div class="profile-form__actions">
              <button type="submit" class="btn btn--primary btn--lg" id="profile-save-btn">
                Save Profile ${icons.check}
              </button>
              <a href="#/dashboard" class="btn btn--ghost btn--lg">
                Back to Dashboard
              </a>
            </div>
          </form>
        </div>
      </section>
    </div>
  `;
}

export async function initProfile() {
    const form = document.getElementById('profile-form');
    if (!form) return;

    const user = getUser();
    if (!user?.id) return;

    // Load existing data from Supabase and prefill form
    try {
        const [{ data: profileData }, { data: app }] = await Promise.all([
            supabase.from('profiles').select('anonymous_in_teams, avatar_path').eq('id', user.id).single(),
            supabase.from('applications').select('answers').eq('user_id', user.id).maybeSingle(),
        ]);

        const answers = app?.answers || {};
        refreshAvatarPreview(user.id, profileData?.avatar_path, user.first_name, user.last_name);

        form.querySelector('#profile-phone').value = answers.phone || '';
        form.querySelector('#profile-school').value = answers.school_name || '';
        form.querySelector('#profile-major').value = answers.program || '';
        form.querySelector('#profile-year').value = answers.year_of_study || '';
        form.querySelector('#profile-github').value = answers.github || '';
        form.querySelector('#profile-linkedin').value = answers.linkedin || '';
        form.querySelector('#profile-portfolio').value = answers.portfolio || '';
        form.querySelector('#profile-dietary').value = answers.dietary || '';
        form.querySelector('#profile-tshirt').value = answers.tshirt_size || '';
        form.querySelector('#profile-why').value = answers.why_attend || '';
        form.querySelector('#profile-experience').value = answers.hackathon_experience || '';
        form.querySelector('#profile-discord').value = answers.discord_username || '';
        form.querySelector('#profile-instagram').value = answers.instagram_handle || '';
        form.querySelector('#profile-whatsapp').value = answers.whatsapp_number || '';
        form.querySelector('#profile-anonymous').checked = profileData?.anonymous_in_teams ?? false;
    } catch (err) {
        console.error('[Profile] Load error:', err);
    }

    // Avatar: upload on file select
    const avatarInput = document.getElementById('profile-avatar-input');
    if (avatarInput) {
        avatarInput.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (!ACCEPT_AVATAR_TYPES.includes(file.type)) {
                showToast('Please choose a JPEG, PNG, or WebP image.', 'error');
                avatarInput.value = '';
                return;
            }
            if (file.size > MAX_AVATAR_SIZE) {
                showToast('Image must be 2 MB or smaller.', 'error');
                avatarInput.value = '';
                return;
            }
            const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            if (!['jpeg', 'jpg', 'png', 'webp'].includes(ext)) {
                showToast('Invalid image format.', 'error');
                avatarInput.value = '';
                return;
            }
            const path = `${user.id}/avatar.${ext === 'jpeg' ? 'jpg' : ext}`;
            const { error: uploadErr } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, { upsert: true });
            if (uploadErr) {
                showToast(uploadErr.message || 'Upload failed.', 'error');
                avatarInput.value = '';
                return;
            }
            const { error: profileErr } = await supabase.from('profiles').update({ avatar_path: path }).eq('id', user.id);
            if (profileErr) {
                showToast('Upload succeeded but profile update failed.', 'error');
                avatarInput.value = '';
                return;
            }
            refreshAvatarPreview(user.id, path, form.querySelector('#profile-fname')?.value, form.querySelector('#profile-lname')?.value);
            showToast('Photo updated.', 'success');
            avatarInput.value = '';
        });
    }

    // Avatar: remove
    const avatarRemove = document.getElementById('profile-avatar-remove');
    if (avatarRemove) {
        avatarRemove.addEventListener('click', async () => {
            const profileRes = await supabase.from('profiles').select('avatar_path').eq('id', user.id).single();
            const path = profileRes?.data?.avatar_path;
            if (path) {
                await supabase.storage.from(AVATAR_BUCKET).remove([path]);
                await supabase.from('profiles').update({ avatar_path: null }).eq('id', user.id);
            }
            refreshAvatarPreview(user.id, null, form.querySelector('#profile-fname')?.value, form.querySelector('#profile-lname')?.value);
            showToast('Photo removed.', 'success');
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fname = form.querySelector('#profile-fname').value.trim();
        const lname = form.querySelector('#profile-lname').value.trim();
        const school = form.querySelector('#profile-school').value.trim();
        const motivation = form.querySelector('#profile-why').value.trim();

        let valid = true;
        [['#profile-fname', fname], ['#profile-lname', lname], ['#profile-school', school], ['#profile-why', motivation]].forEach(([sel, val]) => {
            if (!val) {
                form.querySelector(sel).classList.add('input--error');
                valid = false;
            } else {
                form.querySelector(sel).classList.remove('input--error');
            }
        });

        if (!valid) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }

        const saveBtn = document.getElementById('profile-save-btn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving…';
        }

        try {
            const anonymousInTeams = form.querySelector('#profile-anonymous').checked;
            const { error: profileErr } = await supabase
                .from('profiles')
                .update({ first_name: fname, last_name: lname, anonymous_in_teams: anonymousInTeams })
                .eq('id', user.id);

            if (profileErr) throw profileErr;

            const { data: existingApp } = await supabase
                .from('applications')
                .select('id, answers')
                .eq('user_id', user.id)
                .maybeSingle();

            const newAnswers = {
                ...(existingApp?.answers || {}),
                phone: form.querySelector('#profile-phone').value.trim() || null,
                school_name: school || null,
                program: form.querySelector('#profile-major').value.trim() || null,
                year_of_study: form.querySelector('#profile-year').value || null,
                github: form.querySelector('#profile-github').value.trim() || null,
                linkedin: form.querySelector('#profile-linkedin').value.trim() || null,
                portfolio: form.querySelector('#profile-portfolio').value.trim() || null,
                dietary: form.querySelector('#profile-dietary').value || null,
                tshirt_size: form.querySelector('#profile-tshirt').value || null,
                why_attend: motivation || null,
                hackathon_experience: form.querySelector('#profile-experience').value || null,
                discord_username: form.querySelector('#profile-discord').value.trim() || null,
                instagram_handle: form.querySelector('#profile-instagram').value.trim() || null,
                whatsapp_number: form.querySelector('#profile-whatsapp').value.trim() || null,
            };

            if (existingApp?.id) {
                const { data: updatedRow, error: appErr } = await supabase
                    .from('applications')
                    .update({ answers: newAnswers })
                    .eq('id', existingApp.id)
                    .select('id')
                    .single();
                if (appErr) throw appErr;
                if (!updatedRow) throw new Error('Profile update did not apply. Please try again.');
            } else {
                const { error: appErr } = await supabase
                    .from('applications')
                    .insert({
                        user_id: user.id,
                        status: 'draft',
                        answers: newAnswers,
                    });
                if (appErr) throw appErr;
            }

            await resolveSession();

            updateUser({
                first_name: fname,
                last_name: lname,
                anonymous_in_teams: anonymousInTeams,
                profileComplete: true,
            });

            showToast('Profile saved successfully!', 'success');
            setTimeout(() => {
                window.location.hash = '#/dashboard';
            }, 800);
        } catch (err) {
            console.error('[Profile] Save error:', err);
            showToast(err?.message || 'Failed to save profile. Please try again.', 'error');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = `Save Profile ${icons.check}`;
            }
        }
    });
}
