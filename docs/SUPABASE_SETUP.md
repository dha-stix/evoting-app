# Setting up Supabase for AuthVote (dashboard only)

## 1. Create the project
1. supabase.com/dashboard → **New project**.
2. Name `authvote`, a strong database password (save it), region **Central EU (Frankfurt)** or the closest to your users.
3. Wait until the project shows **Healthy** (about 2 minutes).

## 2. Create the database
1. **SQL Editor → New query**.
2. Paste the whole of `supabase/migrations/20261031000000_init.sql` and click **Run**. You should see "Success. No rows returned".
3. New query: paste `supabase/migrations/20261031000100_api_grants.sql` and **Run** (lets the API roles use the tables; newer projects no longer grant this automatically).
4. New query: paste `supabase/migrations/20261101000000_ondo_lgas.sql` and **Run** (loads Ondo's 18 LGAs grouped into the three senatorial districts, and makes each voter's district follow their LGA).
5. New query: paste `supabase/migrations/20261101000100_election_times.sql` and **Run** (elections can only be scheduled for now or later, by the server's clock).
6. New query again: paste `supabase/seed.sql` and **Run** (adds the 21 INEC parties).
7. Check: **Table Editor** lists `admins, audit_log, candidates, election_candidates, election_tallies, elections, face_challenges, face_templates, otp_codes, lgas, participation, parties, verification_attempts, votes, voters`; `parties` has 21 rows and `lgas` 18.

If a run fails part-way, run `supabase/reset.sql` in a new query (it removes only what the AuthVote migration creates), then run the migration again.

If step 2 fails on an extension, open **Database → Extensions**, enable `vector`, `pgcrypto` and `btree_gist` (schema `extensions`), then run the file again in a fresh project.

## 3. Check storage and realtime
1. **Storage**: buckets `party-logos` (public), `candidate-photos` (public) and `voter-photos` (private) exist.
2. **Database → Publications → supabase_realtime**: `election_tallies` and `elections` are switched on.

## 4. Authentication settings
1. **Authentication → Sign In / Providers → Email**: keep Email enabled. Turn **off** "Allow new users to sign up" (admins are only added by invitation).
2. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (later your live URL)
   - Redirect URLs: add `http://localhost:3000/admin/login` and later `https://YOUR-DOMAIN/admin/login`
3. **Authentication → Multi-Factor**: make sure **TOTP** is enabled (it is by default).
4. Optional, recommended before going live: **Authentication → Emails → SMTP Settings**, enable custom SMTP with Resend (host `smtp.resend.com`, port `465`, user `resend`, password = your Resend API key). The built-in sender only allows a few emails per hour, which limits admin invites.

## 5. Connect the app
**Project Settings → API Keys** (and **Data API** for the URL). In `.env.local`, replace or add:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service_role / secret key>
```

Never put the service role key in client code, a commit or a chat.

## 6. Make yourself the super admin
```bash
npm run create-admin -- you@example.com "Your Name"
```
Then open `/admin/login`, click **Forgot password?**, and follow the emailed link to choose your password. No password is ever set or seen by the script.

## 7. Run and check
```bash
npm run dev
```
- `/admin/login`: sign in; Overview, Elections, Candidates, Parties, Voters and Admins should all load.
- `/register` then `/vote`: register yourself, then sign in; the face check passes while `FACE_SERVICE_MOCK=true` (development only).
- `/results`: votes appear live.
- **Advisors → Security Advisor**: should show no errors.
