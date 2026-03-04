# HackCI Frontend Development Log

This log tracks the changes and implementations made during development. It is kept consistent with the current state of the website.

---

## Restoration Phase (File Recovery & Separation)

*   **Restored Core Files**: Recreated accidentally deleted files including `index.html`, `router.js`, `Footer.js`, `Landing.js`, `Schedule.js`, and `FAQ.js`.
*   **Data Separation**: Extracted hardcoded data from page components into dedicated files in `src/data/` (`landing.js`, `schedule.js`, `faq.js`) for easier maintenance.
*   **Wiring**: Updated `main.js` to correctly import restored styles and components.

---

## Polish Phase (UX & Legal)

*   **404 Page**: Implemented a custom `NotFound.js` component and route handler.
*   **Legal Pages**: Created placeholder `PrivacyPolicy.js` and `CodeOfConduct.js` pages linked from the footer.
*   **Loading State**: Implemented `LoadingSpinner.js` and `LoadingSpinner.css` for visual feedback during transitions.
*   **SEO Utility**: Created `seo.js` to dynamically update document title and meta tags on route changes.

---

## Design System Upgrade (Enhanced Light Mode)

*   **Vibrant Palette**: Updated `variables.css` to replace the "safe" corporate blue with a vibrant "Electric Blue" (`#2563eb`).
*   **Colored Shadows**: Replaced gray shadows with blue-tinted shadows for a "glow" effect in light mode.
*   **Glassmorphism**: Increased opacity and added subtle borders to cards for a premium frosted glass look.
*   **Dynamic Gradients**: Added cool-white to light-blue gradients (`#f8fafc` → `#eff6ff`) for better depth.

---

## Premium Interactivity Implementation

*   **Interactive Hero**: Created `InteractiveBg.js` using HTML5 Canvas to render a "constellation" particle network that reacts to mouse movement.
*   **3D Tilt Effects**: Implemented `tilt.js` (Vanilla JS) to add a 3D perspective tilt and glare effect to feature cards on hover.
*   **Magnetic Buttons**: Added `btn-magnetic` class and CSS logic for buttons that subtly follow the cursor.
*   **Advanced Animations**: Created `animations.css` for staggered reveal animations (`animate-fade-in-up`) and pulse glow effects.
*   **Page Integration**: Updated `Landing.js` to incorporate the interactive background, tilt effects on stats/cards, and intersection observer for scroll reveals.

---

## Roadmap Creation

*   **Strategic Planning**: Analyzed and prioritized 12 potential premium features into a categorized roadmap (`Premium Roadmap.md`) covering "Must-Haves" (App-feel transitions), "Visual Juice" (Aurora effects), and "Tool-like features" (Interactive modals).

---

## Implementation Phase: Premium "Must-Haves"

*   **Smooth Page Transitions**: Implemented global fade-in/fade-out page transitions in `router.js` with a top loading bar (NProgress-style) for a native app feel.
*   **Scroll-Driven Timeline**: Enhanced `Timeline.js` with a vertical progress line that fills on scroll and a blur-to-focus reveal animation for items.
*   **Interactive Schedule Modals**: Created a reusable `Modal.js` component with glassmorphism styling (`modal.css`) and integrated it into `Schedule.js` to show detailed session info on click.
*   **Smart Scroll Spy**: Developed `PageNavigator.js` (a vertical dot navigation) for the Landing Page that highlights active sections on scroll and supports smooth scrolling on click.

---

## Implementation Phase: "Visual Juice" & Refinement

*   **Aurora Background**: Upgraded the hero background (`InteractiveBg.js`) to a premium, multi-layered moving blob effect using canvas radial gradients. Fixed z-index layering issues to ensure visibility.
*   **Sponsor Carousel**: Implemented an infinite scrolling marquee (`SponsorCarousel.js`) for sponsor logos that pauses on hover.
*   **Enhanced Micro-interactions**: Added "press depth" to buttons (scale down on active), sliding icons on hover, and focus-within glow effects for form inputs in `components.css`.
*   **Theme Toggle Fixes**: Resolved duplicate ID issues in `ThemeToggle.js` that broke the toggle button and cleaned up redundant event listeners in `router.js`.
*   **Button Visibility Fix**: Fixed a bug where the "Apply Now" button text became invisible on hover by explicitly forcing `color: #ffffff` in `components.css` to override global link styles.

---

## Implementation Phase: Hybrid Visuals (Aurora + Tech)

*   **Hybrid Background**: Refactored `InteractiveBg.js` to layer a particle constellation network (connecting nodes) *on top* of the existing Aurora blobs, creating a depth-filled "Tech + Magic" aesthetic.
*   **Physics-Based Magnetic Buttons**: Implemented `magnetic.js`, a JS utility that calculates mouse distance to physically pull buttons towards the cursor on hover. Applied this effect to Hero buttons and Navbar links.
*   **Animation Refinement**: Removed conflicting CSS-only transforms in `animations.css` to allow the JS physics engine to control button movement while maintaining smooth return transitions.

---

## Backend & Hackathon Application System (Supabase)

*   **Supabase Integration**: Added `@supabase/supabase-js` and `src/utils/supabase.js` client singleton (reads `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` from `.env`).
*   **Database Schema**: Created `supabase/schema.sql` with `profiles`, `applications`, and `admin_reviews` tables; RLS policies; triggers for auto-create profile on signup and `updated_at`; `exported_at` column on applications for export tracking.
*   **Auth Overhaul**: Replaced localStorage mock in `auth.js` with Supabase Auth (`signInWithPassword`, `signUp`, `signOut`, `getSession`, async session resolution with profile/role lookup). Router guards updated for async session checks.
*   **Application Questions**: Created `src/data/applicationQuestions.js` with full question set across 7 sections (A–G), conditional logic, and helpers (`getActiveQuestions`, `getQuestionsBySection`).
*   **Apply Page**: Implemented `Apply.js` — one-question-at-a-time flow with step animations, debounced autosave (1.5s), progress indicator, review screen, submit/lock. Supports text, email, tel, textarea, select, radio, checkbox, date, url. Draft/resume fully supported.
*   **Profile Page**: Implemented `Profile.js` — participant profile form (Personal Info, Education, Links, Hackathon Details) with first name, last name, school, major, year, phone, GitHub, LinkedIn, portfolio, dietary, t-shirt size, motivation, experience. Linked from Dashboard and Navbar.
*   **Participant Dashboard**: Updated `Dashboard.js` to fetch real application status from Supabase; dynamic CTA per status (Draft/Submitted/Under Review/Accepted/Rejected/Waitlisted).
*   **Admin Dashboard**: Implemented `AdminDashboard.js` — applicant list with filters (status, track, province, beginner), search, table with Name/Email/School/Province/Submitted/Status/Tags; links to detail view; Teams link to `#/admin/teams`.
*   **Admin Application Detail**: Implemented `AdminApplication.js` — full application view grouped by section; Review Decision panel (Accept/Reject/Waitlist/Under Review), score (1–5), tags, internal notes; Save Decision persists to `admin_reviews` and updates `applications.status`.
*   **Routing**: Routes include `#/`, `#/about`, `#/schedule`, `#/faq`, `#/signin`, `#/signup`, `#/dashboard`, `#/profile`, `#/apply`, `#/admin`, `#/admin/application/:id`, `#/admin/teams`, `#/teams`, `#/privacy`, `#/code-of-conduct`. Guards: `auth`, `adminOnly`, `acceptedOnly`, `guestOnly`.

---

## Apply Page: Next/Back Button Fix

*   **Issue**: Next and Back buttons worked only once per step; subsequent clicks were unresponsive. Keyboard (Enter) still worked.
*   **Root Cause**: Stale DOM or invisible layers blocking clicks — exiting step elements, loading overlay not fully removed, or pointer-events from animation layers.
*   **Fix**: Loading state (`apply-loading`) is now fully removed from DOM before rendering steps (`wrap.querySelectorAll('.apply-loading').forEach(el => el.remove())`). Nav button event listeners are attached to the *new* step element via `newStep.querySelector()`, so they always reference the visible, active step — not a stale or animating-out element. Exiting step gets `pointer-events: none` via `exit-left`/`exit-right` animations. Ensures Next/Back remain reliably clickable every step on mouse/touch and keyboard.

---

## Admin Review Persistence

*   **Issue**: In the Admin "Review Decision" panel, setting decision + tags + notes and saving appeared to work, but on leaving and returning to an applicant, the UI was reset (decision/tags/notes not shown).
*   **Root Cause**: Review data was either not being written to `admin_reviews` correctly, or the detail view was not loading and prefilling from the saved row.
*   **Fix**: `loadAndRender` fetches both application and `admin_reviews` row (by `application_id`) via `Promise.all`. The right-hand panel is rendered with `review?.decision`, `review?.score`, `review?.tags`, `review?.notes` to prefill the UI. `wireReviewPanel` initializes `selectedDecision`, `selectedScore`, `activeTags` from `existingReview`. Save Decision upserts to `admin_reviews` with `{ decision, notes, tags, score }` and `onConflict: 'application_id'`. Each applicant has a single review row; state is not shared across applicants.

---

## Export System — Admin Dashboard

*   **Export Utility**: Created `src/utils/exportCsv.js` with `PII_FIELDS`, `buildRows(apps, { excludePii })`, `toCsv(rows)`, `downloadCsv(csvString, filename)`, `trackExported(appIds)` (batched updates of 100).
*   **Schema Change**: Added `exported_at TIMESTAMPTZ` column and `idx_applications_exported_at` index on `applications` for export tracking.
*   **Export Modes**: Admin dashboard supports four export modes — current filtered results, selected applicants only (checkboxes), not reviewed yet, not previously exported.
*   **Selection System**: Checkbox column with select-all in table header; per-row checkboxes; `_selectedIds` Set; delegated event handlers; "Export selected (N)" label.
*   **Export Content**: Flat CSV with metadata (applicant_id, full_name, email, submitted_at, current_status, location_city, location_province, track_interest), all application question columns, and review fields (decision, score, tags, internal_notes, reviewed_at). Multi-select and tags joined with semicolons.
*   **PII Toggle**: "Exclude PII" checkbox omits email, phone, emergency_contact_name, emergency_contact_phone from export; filename suffix `_no_pii` when enabled.
*   **Export Tracking**: After export, `trackExported` updates `exported_at` on applications; in-memory `_allApps` updated so "not previously exported" mode is accurate without reload.
*   **Styles**: Added `.export-toolbar`, `.export-pii-toggle`, `.admin-col-check`, `.row-checkbox`, `.export-btn-loading` in `admin.css`.

---

## Profile Persistence Fix

*   **Issue**: Profile form (Edit Profile) saved only first name and last name to in-memory cache via `updateUser()`. No data was persisted to Supabase. On returning to the page, only email (from auth) appeared; all other fields were empty.
*   **Root Cause**: Submit handler called `updateUser({ name, profileComplete })` which updates only the cached `_currentUser` object in `auth.js`. No Supabase writes were performed. Form also used `user.name` for display while `profiles` table stores `first_name` and `last_name`.
*   **Fix**: Profile save now persists to Supabase: (1) `profiles` table — `first_name`, `last_name`; (2) `applications.answers` JSONB — `phone`, `school_name`, `program`, `year_of_study`, `github`, `linkedin`, `portfolio`, `dietary`, `tshirt_size`, `why_attend`, `hackathon_experience`. Keys align with application question IDs. On load, `initProfile()` fetches existing `applications.answers` and prefills all form fields. Dropdown options (year, dietary, experience) aligned with `applicationQuestions.js` for consistent storage. Creates application row if user has none. Calls `resolveSession()` after save to refresh cached user. Render fixed to use `first_name`/`last_name` from profiles instead of `name`.

---

## Team Hub (Phase 1 MVP)

*   **Database Schema** (`supabase/schema.sql`): Added `teams` (id, name, description, roles_wanted, owner_id), `team_members` (team_id, user_id, joined_at) with UNIQUE on user_id and (team_id, user_id), `join_requests` (team_id, user_id, status: pending/approved/denied). Helper functions: `is_accepted()`, `is_team_owner()`. RLS policies: accepted participants + admins can read teams; only admins can delete (disband); ownership transfer on leave.
*   **Auth**: Extended `resolveSession()` to fetch `applications.status`; added `applicationStatus` to cached user. Exported `isAccepted()`.
*   **Router**: Added `acceptedOnly` guard — non-accepted users redirect to dashboard with toast. Routes: `#/teams` (Team Hub), `#/admin/teams` (Admin Teams).
*   **Team Hub Page** (`TeamHub.js`): Two views — (1) No-team: Create Team form (name, description, roles wanted), browse open teams (< 4 members), Request to Join (disabled if pending). (2) My-team: Team detail, member cards (name, school/major/year, experience, GitHub/LinkedIn/portfolio only — no email/phone per privacy rules), Pending Requests (owner Approve/Deny), Leave Team. Owner leave: transfers ownership to earliest-joined member; if sole member, must ask admin to disband.
*   **Admin Teams Page** (`AdminTeams.js`): Stats (teams, placed, at capacity). Table: team name, member count, owner, View/Disband. Team detail modal: members with safe profile fields, Remove Member, Assign Member (from accepted users not on any team). Create Team: name, description, roles, assign up to 4 accepted participants. Enforces 4-member cap. Teams link added to Admin Dashboard header.
*   **Styles**: `teams.css` for Team Hub and Admin Teams.
*   **Dashboard**: Team Hub CTA card visible only to accepted users.
*   **Navbar**: Team Hub link visible only to accepted participants (desktop + mobile).
*   **Data Integrity**: One team per participant (UNIQUE on user_id in team_members). Join request per (team_id, user_id). Full teams reject new approvals.

---

## Team Hub: Privacy, Contact & Re-join Fixes

*   **Anonymous in Teams**: Added `anonymous_in_teams` column to `profiles`; participants can opt to show "Anonymous" instead of name to teammates. `get_team_visible_profiles` RPC enforces visibility rules (same-team members see full profile; team owners see pending requesters; pending requesters see teammates).
*   **Teammate Contact Fields**: Extended Profile form with Discord username, Instagram handle, WhatsApp number, and phone. Stored in `applications.answers`; visible only to teammates via `get_team_visible_profiles` RPC (contact links on member cards in My Team view).
*   **Team Hub RPC Migration**: Replaced direct `profiles` / `applications` queries in TeamHub with `get_team_visible_profiles` for members and pending requesters. Pending request rows expanded to full profile cards (school, major, year, experience, links) with Approve/Deny actions.
*   **Join Request on Leave Fix**: Users who were approved, joined, then left could not request again — `join_requests` row with status `approved` remained and blocked new inserts (unique constraint). Fix: added `join_requests_delete` RLS policy (users can delete their own rows); `handleLeaveTeam` now deletes the user's `join_requests` row when leaving. Migration `fix_join_request_on_leave.sql` adds the policy and cleans up orphaned approved rows where the user is no longer in the team.

---

## Profile & Contact Save Fix (Applications RLS)

*   **Issue**: Contact info (Discord, Instagram, WhatsApp) and other profile fields in `applications.answers` appeared to save on the Profile page but were not persisted for submitted or accepted users. Teammates could not see contact details; returning to Profile showed fields empty.
*   **Root Cause**: RLS policy `applications_update` allowed UPDATE only when `status = 'draft'`. Once a user submitted or was accepted, the applications row update was blocked; the UI still showed "Profile saved" because the profiles table update (name, anonymous_in_teams) succeeded and Supabase often returns no error when 0 rows are updated.
*   **Fix**: Migration `allow_profile_updates_after_submission.sql`: dropped the draft-only policy and created a new one so users can update their own application row anytime (for profile/contact in `answers`). Trigger `applications_prevent_draft_revert_trigger` prevents non-admins from setting `status` back to `draft` after submission. Profile save now uses `.select('id').single()` after the applications update and surfaces an error if the update did not apply.

---

## Team Profile Card: Contact, De-duplication & Layout

*   **Privacy & Visibility**: Before joining a team (browse / pending requests), phone and WhatsApp are not shown. After joining (team members view), contact (Phone/WhatsApp) is shown; Discord and Instagram are icon-only in both contexts (no usernames on cards).
*   **Phone vs WhatsApp De-duplication**: If only WhatsApp → show WhatsApp icon/link; if only Phone → show Phone icon (click-to-call); if both and same number → show only WhatsApp; if both and different numbers → show both. Normalization uses digits-only comparison. Implemented in `getPhoneWhatsAppDisplay()` and contact row in `TeamHub.js`.
*   **Social (Discord/Instagram)**: Icon-only display; no username text on the card. Links: Discord → discord.com; Instagram → profile URL from handle. New `.team-hub-member-social` row.
*   **Layout & Overlap**: Contact/social rows use flex + wrap and icon-only links (no long number text) to avoid overlap. Card uses `.team-hub-member-header` (avatar + info); `.team-hub-member-contact` and `.team-hub-member-social` have consistent spacing and `min-width: 0` for responsive layout. Styles in `teams.css`.
*   **Icons**: Added `phone` and `whatsapp` SVG icons in `src/assets/icons.js`.

---

## Optional Profile Avatar Upload (Participant)

*   **Goal**: Allow participants to upload an optional profile picture for recognition in team formation and in-person events, without requiring a real photo and without exposing avatars on the landing page.
*   **Database & Storage**: Migration `add_profile_avatar.sql`: added `avatar_path TEXT` to `profiles`; created storage bucket `avatars` (public, 2 MB limit, image/jpeg, image/png, image/webp). Policies: authenticated users can INSERT/UPDATE/DELETE only under path `{user_id}/...`; SELECT for authenticated. Dropped and recreated `get_team_visible_profiles(uuid[])` so it returns `avatar_path` (avoids "cannot change return type" error when adding the column).
*   **Profile Page**: New optional "Profile Picture" section: helper text ("Optional. You may upload a photo or avatar. It does not need to be your real photo."), preview (image or initials circle with deterministic color from user ID), "Upload photo" (accept JPEG/PNG/WebP, max 2 MB), "Remove" button. Upload writes to `avatars/{user_id}/avatar.{ext}` and updates `profiles.avatar_path`; remove deletes object and clears `avatar_path`. Fallback: if image fails to load or is removed, initials avatar is shown with consistent layout.
*   **Shared Avatar Utils** (`src/utils/avatar.js`): `getInitialsFromName`, `getInitials`, `getAvatarColor(userId)` (deterministic palette), `getAvatarPublicUrl(avatarPath)`, `buildAvatarHtml(opts, escapeHtml)` (image with onerror fallback to initials circle). Used by Profile, Team Hub, and Admin.
*   **Visibility**: Avatars are visible only to accepted participants in Team Hub (browse + member view) and in the Admin dashboard/detail. Not shown on landing or to non-accepted users. Enforced by RPC and by not rendering avatars on public pages.
*   **Team Hub & Admin**: Team member cards show avatar (or initials fallback) in a header with name/school/experience. Admin list and application detail show avatar or initials. Avatar sizes: `avatar--sm` (36px), `avatar--md` (48px), `avatar--lg` (96px); circular crop, no layout break when missing or invalid.

---

## Auth Polish + Google OAuth (Supabase)

*   **Google OAuth**: Added "Continue with Google" on Sign In and Sign Up pages. `signInWithGoogle()` in `auth.js` uses `signInWithOAuth` with redirect to app root; router intercepts `#access_token=` callback, calls `ensureProfile()`, then routes by profile completeness and admin role.
*   **Account linking**: Same-email behavior (email/password + Google → one account) relies on Supabase Dashboard: Authentication → Settings → "Allow users to link identities with same email address" (user must enable manually).
*   **Post-login routing**: After Google callback: missing first/last name → `#/profile`; admin → `#/admin`; else → `#/dashboard`. Email/password login unchanged; session and guards unchanged.
*   **Auth error handling**: Sign In and Sign Up map backend errors to clear messages: invalid credentials, email not confirmed, rate limit, network error, already registered, weak password, invalid email. No false positives: "account created" / "signed in" only when backend confirms; duplicate-email edge case (`data.user`/`data.session` null, no error) shows neutral message and redirects to sign-in.
*   **Form UX**: Submit and Google buttons disabled with loading state during requests; errors shown near form; user input preserved on error.
*   **Profile consistency**: `resolveSession()` bootstraps a profile row if missing (OAuth trigger race). `ensureProfile()` creates or fills profile from Google metadata after callback. Application draft/save/resume works the same for email and Google users; no duplicate application from switching auth method.
*   **Session & sign-out**: Sign out clears session and cache; protected routes redirect unauthenticated users; auth state stable on refresh (`persistSession: true`).
*   **Migration**: `fix_google_oauth_trigger.sql` updates `handle_new_user()` to set `first_name`/`last_name` from both email signup metadata (`first_name`/`last_name`) and Google metadata (`given_name`/`family_name`/`full_name`/`name`).
*   **Styles**: `.btn--google`, `.auth-divider`, `.auth-spinner--dark` in `SignIn.css` for Google button and "or" divider.
*   **Non-goals (for later)**: LinkedIn OAuth, GitHub OAuth, passwordless magic links, multi-factor auth.

---

## Application Form — Finalized Question Set

*   **Restructure**: Replaced the application form with a new finalized question set across 7 sections (A–G): Basic Info, Education & Background, Links, Motivation, Team, Logistics, Consent.
*   **Removed**: Entire "Skills & Role" section (Primary Role Interest, Top Skills); Portfolio and Devpost URL fields; Background, Tracks, Most Excited, Proud Project, Project Idea; Team name, Collaboration style; Commute distance; Workshop topics.
*   **Basic Info**: Legal first/last name, preferred name (optional), email (prefilled), age range, province/territory, city, can attend (Yes in person / Online only / Either / Not sure).
*   **Education & Background**: Student? (Yes/No) with conditional school, program, year of study; Hackathon experience (First time / 1–2 / 3–5 / 6+); Overall skill level (Beginner / Intermediate / Advanced).
*   **Links**: GitHub URL and LinkedIn URL — both required (was optional).
*   **Motivation**: Two required questions only — "Why do you want to attend HackCI?" and "What would make this weekend a 'win' for you?"
*   **Team**: Has teammates? (Yes/No); Teammate emails (optional, if Yes); Want help finding a team? (Yes/No, required if No).
*   **Logistics**: Dietary restrictions, accessibility accommodations (Yes/No), accessibility details (required if Yes), travel support, emergency contact (optional).
*   **Consent**: Code of Conduct checkbox, photo/video consent (Yes/No), data privacy consent, email consent, anything else (optional).
*   **Preserved**: One-question-at-a-time flow, animations, autosave, review/submit, conditional branching. Admin dashboard, exports, and status logic unchanged. TRACKS and SKILLS_OPTIONS retained for admin filter and TeamHub.

---

## Visual Polish Enhancements

*   **Accessibility & UX**: Added `scroll-behavior: smooth` for anchor links; `:focus-visible` outline for buttons, inputs, links, and navbar for keyboard accessibility; `@media (prefers-reduced-motion: reduce)` to respect user motion preferences.
*   **Typography**: Loaded JetBrains Mono font; applied to countdown numbers and stats bar numbers with `font-variant-numeric: tabular-nums` for a techie aesthetic.
*   **Hero Enhancements**: Badge ("Registrations Now Open") now has border and glow; subtle SVG noise/grain overlay on hero gradient; "HackCI" title uses gradient (accent-primary → accent-secondary) for premium feel.
*   **Layout**: Gradient dividers between sections (`.section + .section::before`); glass cards get stronger hover glow; footer has subtle grid texture; navbar brand text shows gradient on hover.
*   **Loading Bar**: Updated to use CSS variables (`var(--accent-primary)`, `var(--accent-secondary)`) for theme consistency.
*   **Stats Bar Count-Up**: IntersectionObserver triggers animated count-up when stats bar enters viewport; numbers (500+, $10k, 48h) animate from 0 with ease-out curve. `landingStats` extended with `target`, `prefix`, `suffix` for animation.

---

## Privacy Policy & Code of Conduct Overhaul

*   **Privacy Policy**: Rewrote `PrivacyPolicy.js` with a comprehensive policy covering: introduction, information collected (account, application, profile, technical), how we use it, data sharing (teammates, sponsors aggregate, service providers, legal), security, retention, your rights, cookies, minors, changes, and contact. Aligned with HackCI's actual data practices (Supabase, Team Hub visibility, profile fields, application answers).
*   **Code of Conduct**: Expanded `CodeOfConduct.js` with detailed sections: Our Standard (harassment definition), Expected Behavior, Unacceptable Behavior, Consequences, Reporting, Scope. Professional, event-appropriate content.
*   **Legal Pages Styling**: Created `src/styles/legal.css` with professional layout — page-hero (consistent with FAQ/About), legal-back-link, legal-meta, legal-content (glass-card with proper spacing), h3/p/ul styling, legal-footer. Replaced undefined Tailwind-style classes (`btn--text`, `mb-6`, `p-8`) with proper design-system classes.
*   **Layout Fix**: Legal pages now use `page-hero` section and `section` wrapper for consistent padding, navbar offset, and gradient background. Removed broken/inconsistent styling that caused layout issues.