# HackCI Content Implementation Report

This report summarizes the content changes made using `hackci-content.md` as the single source of truth.

---

## 1. Content changed (by file)

### Branding (CI Hacks → HackCI)
- **src/components/Navbar.js** — Brand text "CI Hacks" → "HackCI" (desktop and mobile).
- **src/components/Footer.js** — Brand "CI Hacks" → "HackCI"; copyright "CI Hacks" → "HackCI". Mailto links kept as-is.
- **src/utils/seo.js** — baseTitle "CI Hacks 2024" → "HackCI"; baseDesc updated to Ontario Tech, 150–250 students, overnight stay (from .md).
- **src/pages/SignIn.js** — Subtitle "CI Hacks account" → "HackCI account".
- **src/pages/SignUp.js** — Subtitle "Join CI Hacks" → "Join HackCI".
- **src/pages/Profile.js** — Label "attend CI Hacks" → "attend HackCI".
- **src/pages/Dashboard.js** — "accepted to CI Hacks" and "Welcome to CI Hacks" → "HackCI".
- **src/pages/Apply.js** — "applying to CI Hacks" → "HackCI".
- **src/data/applicationQuestions.js** — All question/helper/option strings: "CI Hacks" → "HackCI" (legal name, why attend, build at HackCI, Code of Conduct, photo consent, data consent, email consent). Code of Conduct URL (cihacks.ca) unchanged and documented in Pending.
- **src/pages/legal/CodeOfConduct.js** — "CI Hacks is dedicated" → "HackCI is dedicated".
- **src/pages/legal/PrivacyPolicy.js** — "register for CI Hacks" → "register for HackCI". Contact email kept.
- **src/pages/FAQ.js** — Subtitle "about CI Hacks" → "about HackCI".
- **src/pages/Landing.js** — Hero "CI Hacks" → "HackCI"; section title "Why Join CI Hacks?" → "Why Join HackCI?".
- **src/pages/About.js** — All "CI Hacks" → "HackCI" in titles and body copy.
- **src/data/landing.js** — "CI Hacks merch" → "HackCI merch" in features (then features replaced entirely; see below).
- **src/data/faq.js** — All "CI Hacks" → "HackCI" in q/a and full answer rewrites from .md.
- **src/main.js** — Comment "CI Hacks" → "HackCI".
- **src/styles/components.css, variables.css, global.css** — Header comments "CI Hacks" → "HackCI".
- **index.html** — meta description, keywords, author, og:title, og:description, title: "CI Hacks" → "HackCI"; removed "500+ developers" and "$10k in prizes" from description; new description from .md (Ontario Tech, 150–250 students, overnight stay).

### Home page (Landing)
- **src/pages/Landing.js** — Hero subtitle replaced with: "A 48-hour hackathon at Ontario Tech University. Join 150–250 students from multiple universities; overnight stay on campus." Hero meta: "Innovation Hall" / "San Francisco, CA" → "Ontario Tech University" / "Ontario • In-Person".
- **src/data/landing.js** — All three feature cards replaced with .md-only content: (1) Workshops & Guidance — workshops, guidance, hacking sessions, networking with companies; (2) Networking with Companies — Ontario Power Generation, co-op opportunities; (3) Build & Present — apply/develop skills, tackle real-world problems, deliver to judges. No prize amounts. Stats bar (500+, $10k, 48h) left in code; documented in hackci-content.md Pending.

### About page
- **src/pages/About.js** — Hero subtitle replaced with Overview verbatim: "HackCI, presented by CI Tech, is a 48-hour hackathon taking place at Ontario Tech University near the end of March. The event is expected to host approximately 150–250 students from a variety of universities. Students are welcome to stay overnight on campus." Mission block replaced with .md Mission: goal (engaging activities, passion for innovation); solo or teams; HackCI provides (Workshops, Guidance, Hacking sessions, Networking with companies); Students will have the opportunity to (apply/develop skills, tackle real-world problems, network e.g. OPG, explore co-op, build and deliver to judges). What to Expect, Meet the Team, Our Sponsors left as-is; documented in Pending.

### FAQ
- **src/data/faq.js** — General: "What is HackCI?" — Overview text; "When and where is HackCI?" — Ontario Tech, near end of March, exact dates TBD; "How much does it cost?" — free, meals/activities from CI Tech and sponsors; "Who can participate?" — students, multiple universities, solo or team. Registration: deadline answer made generic ("will be announced"); rest kept. During the Event: "Are there prizes?" — no dollar amounts, "build and deliver to judges; prizes and recognition will be announced"; workshops answer aligned to .md (APIs, UI/UX, GitHub, deployment & pitching). **src/pages/FAQ.js** — Subtitle only (HackCI); contact CTA unchanged.

### Schedule (event overview)
- **src/data/schedule.js** — Fully replaced with content from .md "Event Structure Overview" and "Detailed Schedule (Internal Use Only)": Day 1 Friday (Registration & Team Formation, Opening Ceremony, TMC Session & Dinner, Networking Event, Late-night snacks); Day 2 Saturday (Breakfast, Optional Physical Activity, Hacking Session #1, Lunch, Workshops/Mentor Hours, Hacking Session #2, Dinner, Hacking Session #3, Late-night snacks); Day 3 Sunday (Breakfast, Project Deadline, Live Presentations & Judging, Lunch & Networking, Closing Ceremony). Times and titles from .md; locations set to "Campus" or "Main Stage" where appropriate. categoryColors unchanged.

### Pending section in markdown
- **hackci-content.md** — Appended "## Pending" with: stats/placeholders to remove (stats bar, index meta); content left as-is (contact, team, sponsors, What to Expect, Experience the Energy, timeline dates, countdown, year); still needed (prizes, exact dates, contact/URL, organizers, sponsors).

---

## 2. Content used from hackci-content.md

- **Overview** — Event name, presenter (CI Tech), duration (48-hour), location (Ontario Tech University), timing (near end of March), expected attendance (150–250 students, multiple universities), overnight stay, budget/sponsors/meals (CI Tech, EngSoc). Used for: hero subtitle, hero meta, About hero, FAQ "What is HackCI?", "How much does it cost?", index and seo meta descriptions.
- **Mission** — Goal (engaging activities, passion for innovation), solo or teams, what HackCI provides (Workshops, Guidance, Hacking sessions, Networking with companies), students’ opportunities (apply/develop skills, tackle real-world problems, network e.g. OPG, co-op, build and deliver to judges). Used for: About mission block, Landing feature cards.
- **Expected Attendance** — 150–250 students, multiple universities, overnight. Used in hero and FAQ copy.
- **Event Structure Overview** — Friday/Saturday/Sunday high-level items. Used to align schedule structure.
- **Detailed Schedule (Internal Use Only)** — All times and session names for Day 1–3. Used to populate `schedule.js` (scheduleData).
- **Outcomes & Impact** — Not copied verbatim into UI; informed tone (e.g. networking with companies, workshops). No direct "Companies sponsoring…" / "CI Tech will…" blocks on the site.

---

## 3. Content not used yet

- **Outcomes & Impact** — Bullets for sponsors (brand visibility, guest speaking, networking, connect with students), CI Tech (industry relationships, reputation), and students (grow skills, network, project experience, workshops, engaging activities) are not placed on any page. Could be used later for an "Impact" or "Sponsors" section.
- **Detailed Schedule** sub-bullets (e.g. Opening: welcome remarks, event overview, safety, theme/challenge; TMC: guest speakers, TMC staff, quiz; Workshops: APIs, UI/UX, GitHub, Deployment & Pitching; mini activities with small prize) are not in the schedule UI; only top-level session titles and times are used.

---

## 4. Still needed (placeholders / real data to replace)

- **Prizes** — Amounts, categories, and sponsor-specific prizes when finalized. Currently no dollar figures on the site; FAQ says "prizes and recognition will be announced."
- **Exact event dates** — Weekend (e.g. which March dates) and application deadline. Currently "near the end of March" and "Exact dates will be announced" / "deadline will be announced."
- **Contact email and Code of Conduct URL** — hello@cihacks.com and cihacks.ca/code-of-conduct are still in the site; replace if official contact/URL differ.
- **Organizer names and roles** — About "Meet the Team" still uses placeholder names (Sarah Chen, Marcus Rivera, etc.); replace with real organizers when available.
- **Sponsor names and tiers** — About "Our Sponsors" still uses "Sponsor A/B/C…" and "Partner F/G…"; replace with real sponsors and tiers.
- **Home page stats bar** — "500+ Hackers", "$10k Prizes", "48h Bootcamp" left in code; replace with real numbers (e.g. 150–250 students, TBD prizes) when implementing Pending.
- **Landing timeline dates** — `timelineItems` in landing.js still use placeholder dates (e.g. MAR 01, APR 05, APR 07 2024); replace with actual HackCI dates when confirmed.
- **Countdown target** — CountdownTimer.js uses a placeholder target; set to actual event start when date is confirmed.
- **Year (2024/2025)** — Document does not specify event year; hero and meta still show "2024" where applicable; update when confirmed.
