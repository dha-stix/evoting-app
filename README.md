# AuthVote

Verified e-voting for Nigerian elections. Voters register with their NIN and a live face scan, sign in on election day with their VIN, an email code and a liveness-checked face match, cast a secret ballot, and watch results update in real time. Election officers manage elections, candidates, parties and voters from an admin panel.

Built by [David Asaolu](https://www.linkedin.com/in/david-asaolu234/).

## Stack

- **Next.js 14** (App Router, server actions), TypeScript, Tailwind CSS, Framer Motion
- **Supabase**: Postgres with row-level security, pgvector, Auth (admins, with TOTP two-step), Storage, Realtime
- **Face service** (`face-service/`): Python FastAPI with InsightFace ArcFace embeddings and MiniFASNet anti-spoofing
- **MediaPipe Face Landmarker** in the browser to guide the user through the liveness steps
- **Resend** for VIN and sign-in code emails

## How verification works

1. **Registration.** The browser guides the voter to face the camera, blink, turn their head in a direction the server picked at random, and look back. Three un-mirrored frames go to the server, which checks there is exactly one real (not spoofed) face, that the head actually turned the right way, and that all frames show the same person. The ArcFace template is compared with every enrolled voter (pgvector) to block duplicate registrations, then stored.
2. **Sign-in.** VIN + NIN + date of birth (NIN is stored only as a keyed hash) → 6-digit email code → the same liveness sequence, matched 1:1 against the voter's own template. Three failed face checks pause sign-in for 30 minutes.
3. **Voting.** `cast_vote()` runs in one database transaction: it records *that* the voter took part and, in a separate table with no voter column, *what* was voted. A primary key makes a second vote impossible. Each ballot returns a receipt code anyone can check on the results page.

The browser never decides anything; all checks and thresholds run on the server.

## Project structure

```
images/                     Static images (put official party logos in images/parties/)
face-service/               Python face service (Dockerfile included)
supabase/migrations/        Database schema, policies, functions, storage buckets
supabase/seed.sql           INEC-registered parties
src/app/(site)/             Public pages: home, register, vote, card, results, verify
src/app/(ballot)/           Ballot screen
src/app/admin/              Admin sign-in and panel
src/components/             Page sections and shared UI, grouped by page
src/lib/supabase.ts         Supabase clients (server)
src/lib/supabase-actions.ts All server actions (registration, sign-in, voting, admin)
src/lib/queries.ts          Read queries used by pages
src/lib/face.ts             Liveness and matching decisions
src/styles/                 Global styles
```

## Setup

### 1. Supabase

1. Restore or create the project, then run `supabase/migrations/20261031000000_init.sql` and `supabase/seed.sql` (SQL editor, or `supabase db push`).
2. Create your account under **Authentication → Users**, then make yourself the first super admin with the SQL at the bottom of `seed.sql`.
3. Optional: under **Authentication → URL configuration**, add your site URL so admin invites redirect correctly.

### 2. Face service

```bash
cd face-service
docker build -t authvote-face .
docker run -p 8000:8000 -e FACE_SERVICE_KEY=change-me authvote-face
```

Deploy the same image to Render, Railway, Fly.io or any container host (about 1 GB of memory). Check `GET /health` reports `"antispoof": true`.

### 3. The web app

```bash
cp .env.example .env.local   # then fill it in
npm install
npm run dev
```

To try the screens before the face service is running, set `FACE_SERVICE_MOCK=true` (development only).

## Demo accounts

After the migration and `seed.sql` are applied:

```bash
npm run seed:demo
```

This creates a demo super admin, a demo voter (Akure South, Ondo Central), two live elections that voter can vote in, and a finished election with results. The login details are at the top of [`scripts/seed-demo.mjs`](scripts/seed-demo.mjs); override them with `DEMO_ADMIN_EMAIL`, `DEMO_ADMIN_PASSWORD` and `DEMO_VOTER_EMAIL` before deploying a public demo.

- **Admin pages:** sign in at `/admin/login` with the demo admin.
- **Voting:** sign in at `/vote` with the demo VIN, NIN and date of birth. Sign-in codes for `@demo.authvote.local` addresses are printed in the `npm run dev` terminal instead of emailed. The demo voter has a placeholder face, so set `FACE_SERVICE_MOCK=true` (development only) to pass the face check; to test real face matching, register yourself.
- **Voter card:** `/card` with the demo VIN and date of birth.

## Scripts

- `npm run dev`: development server
- `npm run build` / `npm start`: production build
- `npm run lint`: ESLint
