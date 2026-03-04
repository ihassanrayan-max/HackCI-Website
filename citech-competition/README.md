# CITech Competition Portal

A full-stack competition management platform for the **CITech 2026 week-long competition** (March 20–27, 2026). Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, and Supabase.

## Features

- **Landing page** — public-facing event info, prizes, and sign-up CTA
- **Authentication** — email/password + Google OAuth via Supabase
- **Participant registration** — multi-field form with OTU / other university support
- **Participant dashboard** — bento-grid status tracker, briefing, submission portal, results
- **Team Hub** — create teams, browse teams, request to join, approve/deny join requests, kick members, rename, disband — with real-time Supabase updates
- **Participant profiles** — public profiles visible to teammates
- **Admin panel (OVERSEER)** — full participant management, event lifecycle controls (applications, briefing, submissions, results), team management, result assignment, CSV export
- **Middleware auth** — SSR-protected routes redirecting unauthenticated users

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend | Supabase (Postgres + RLS + Realtime) |
| Auth | Supabase SSR (`@supabase/ssr`) |

## Local Development

```bash
cd citech-competition
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create a `.env.local` file in the `citech-competition/` directory:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database

All tables are prefixed with `comp_` to avoid collisions with other projects in the same Supabase instance. See `supabase/comp_schema.sql` for the full schema and `supabase/migrations/` for incremental migration files.

## Deployment

This app is deployed via Netlify with the base directory set to `citech-competition/`.

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: 20+
