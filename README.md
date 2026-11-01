# AuthVote

**Verified electronic voting for Nigerian elections.**

AuthVote is a web platform for running secure, transparent elections in Ondo State, Nigeria. Citizens register once with their National Identification Number (NIN) and a live face scan. On election day they prove who they are with their Voter ID Number, an email code and a liveness-checked face match, cast a secret ballot, and watch results update in real time. Election officers run everything from an admin panel: elections, candidates, political parties and the voter register.

It began as my final-year project and has been rebuilt as a production-ready application.

Built by [David Asaolu](https://www.linkedin.com/in/david-asaolu234/).

---

## Features

### For voters
- **Registration** in four guided steps: personal details and NIN, origin and residence, a live face scan, then review. Each voter receives a unique Voter ID Number (VIN) by email.
- **Sign-in to vote** with VIN, NIN and date of birth, then a one-time email code, then a live face check against the face enrolled at registration.
- **Secret ballot** for every election the voter is eligible for, with a confirmation step and a receipt code.
- **Voter card** with photo and a QR code that officials can scan to confirm it is genuine. It prints front and back at real ID-card size (85.6 × 54 mm), ready to cut out and laminate.
- **Live results** for every election, with turnout by senatorial district and by LGA, and a public receipt checker that confirms a ballot was counted without revealing the choice.

### For election officers
- **Overview** dashboard: registered voters, live turnout, face-check success rate, registrations over the last 14 days and recent activity.
- **Elections**: schedule governorship or senatorial elections. Times use the server's clock and Nigerian time (WAT); only today and future dates can be chosen. Elections open and close on their own, and can be ended early.
- **Candidates** with photos, party, office and running mate (one candidate per party per office).
- **Political parties** registered with INEC, with their official logos.
- **Voters**: search, filter by LGA, view details and participation, suspend or reinstate, export to CSV.
- **Admins and audit log**: three roles (super admin, election officer, observer), email invitations, optional authenticator-app two-step sign-in, and a log of every admin action.

### Ondo State rules built in
- All **18 LGAs** are preloaded and grouped into the three senatorial districts:
  - **Ondo North:** Akoko North-East, Akoko North-West, Akoko South-East, Akoko South-West, Ose, Owo
  - **Ondo Central:** Akure North, Akure South, Idanre, Ifedore, Ondo East, Ondo West
  - **Ondo South:** Ese Odo, Ilaje, Ile Oluji/Okeigbo, Irele, Odigbo, Okitipupa
- A voter's senatorial district always comes from their LGA of residence, so only residents of a district's LGAs can vote for its senator. Every registered voter in the state can vote for governor.

---

## How verification works

1. **Liveness at registration.** The browser guides the voter to face the camera, blink, turn their head in a direction chosen at random by the server, and look back. Three frames go to the server, which checks there is exactly one real face (not a photo or a screen), that the head really turned the requested way, and that every frame shows the same person.
2. **Face template.** An ArcFace face template is extracted and compared with everyone already registered (using pgvector), so the same person cannot register twice with different NINs.
3. **Sign-in.** VIN, NIN and date of birth must match (the NIN is stored only as a keyed hash). A six-digit code is emailed, then the same liveness sequence is matched one-to-one against the voter's own template. Three failed face checks pause sign-in for 30 minutes.
4. **Casting a vote.** A single database transaction records *that* the voter took part and, separately and with no link to the voter, *what* was voted. The database refuses a second vote in the same election, a vote outside the voter's district, and any vote outside the election's opening hours.

The browser only guides the voter; every decision is made on the server.

---

## Tech stack

| Area | Technology |
| --- | --- |
| Web app | Next.js 14 (App Router, server actions), React 18, TypeScript |
| Styling and motion | Tailwind CSS, Framer Motion, Lucide icons, self-hosted fonts |
| Forms | React Hook Form, Zod |
| Database and storage | Supabase: Postgres with row-level security, pgvector, Realtime, Storage |
| Authentication | Supabase Auth for admins (with TOTP two-step); signed session cookies for voters |
| Face recognition | Python FastAPI service with InsightFace (ArcFace) and MiniFASNet anti-spoofing |
| In-browser guidance | MediaPipe Face Landmarker |
| Email | Resend |

---

## Project structure

```
images/                       Party logos and candidate portraits
face-service/                 Python face service (Dockerfile included)
supabase/migrations/          Database schema, security policies, functions and storage
supabase/seed.sql             INEC-registered political parties
supabase/reset.sql            Removes everything the migrations create (for a clean re-run)
scripts/create-admin.mjs      Makes an account a super admin
docs/SUPABASE_SETUP.md        Step-by-step Supabase setup through the dashboard
src/app/(site)/               Public pages: home, register, vote, card, results, verify
src/app/(ballot)/             Ballot screen
src/app/admin/                Admin sign-in, password setup and the admin panel
src/components/               Page sections and shared UI, grouped by page
src/lib/supabase.ts           Supabase clients
src/lib/supabase-actions.ts   Server actions: registration, sign-in, voting, admin
src/lib/queries.ts            Read queries used by pages
src/lib/face.ts               Liveness and face-matching decisions
src/lib/data/ondo.ts          Ondo LGAs and senatorial districts
src/styles/                   Global styles
```

---

## Getting started

### Requirements
- Node.js 20 or newer
- A Supabase project
- Docker, to run the face service
- A Resend account, for email

### 1. Database
Follow [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md). In short, run these files in the Supabase SQL Editor, in order:

1. `supabase/migrations/20261031000000_init.sql`
2. `supabase/migrations/20261031000100_api_grants.sql`
3. `supabase/migrations/20261101000000_ondo_lgas.sql`
4. `supabase/migrations/20261101000100_election_times.sql`
5. `supabase/seed.sql`

### 2. Environment
```bash
cp .env.example .env.local
```
Fill in the Supabase URL and keys, a `SESSION_SECRET` and `NIN_PEPPER` (generate each with `openssl rand -base64 48`), the Resend key and the face-service settings. Every variable is explained in [.env.example](.env.example).

### 3. Face service
```bash
cd face-service
docker build -t authvote-face .
docker run -p 8000:8000 -e FACE_SERVICE_KEY=your-shared-key authvote-face
```
Use the same key as `FACE_SERVICE_KEY` in `.env.local`. `GET /health` should report `"antispoof": true`. To try the screens before the face service is running, set `FACE_SERVICE_MOCK=true` (development only).

### 4. Run the app
```bash
npm install
npm run dev
```
Open http://localhost:3000.

### 5. First administrator
```bash
npm run create-admin -- you@example.com "Your Name"
```
Then open `/admin/login`, choose **Forgot password?**, and set your password from the emailed link.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run create-admin -- <email> "<name>"` | Make an account a super admin |

---

## Notes

- **Email:** without a verified domain, Resend only delivers to the Resend account's own address. Verify a domain in Resend and set `EMAIL_FROM` before inviting voters. In development, `DEV_SHOW_EMAIL_CODES=true` shows the sign-in code on screen when an email cannot be delivered.
- **Candidates:** the candidates in this project are fictional, and their portraits are original illustrations.
- **Party logos:** official logos of INEC-registered parties are used to identify each party.

---

## Licence

© 2026 David Asaolu. All rights reserved.
