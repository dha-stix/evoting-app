# Setting up Supabase for AuthVote (dashboard only)

## 1. Create the project
1. supabase.com/dashboard → **New project**.
2. Name `authvote`, a strong database password (save it), region **Central EU (Frankfurt)** or the closest to your users.
3. Wait until the project shows **Healthy** (about 2 minutes).

## 2. Create the database
1. **SQL Editor → New query**.
2. Paste the whole of `supabase/migrations/20261031000000_init.sql` and click **Run**. You should see "Success. No rows returned".
3. New query: paste `supabase/migrations/20261031000100_api_grants.sql` and **Run** (lets the API roles use the tables; newer projects no longer grant this automatically).
4. New query again: paste `supabase/seed.sql` and **Run** (adds the 21 INEC parties).
5. Check: **Table Editor** lists `admins, audit_log, candidates, election_candidates, election_tallies, elections, face_challenges, face_templates, otp_codes, participation, parties, verification_attempts, votes, voters`, and `parties` has 21 rows.

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

## 6. Create the demo accounts
```bash
npm run seed:demo
```
It creates a demo super admin, a demo voter and three demo elections, and prints where to use them. Details are at the top of `scripts/seed-demo.mjs`.

## 7. Make yourself a real super admin (optional)
1. **Authentication → Users → Add user → Create new user**: your email and a password, tick "Auto confirm".
2. SQL Editor:
   ```sql
   insert into public.admins (id, full_name, email, role)
   select id, 'Your Name', email, 'super_admin' from auth.users where email = 'you@example.com';
   ```

## 8. Run and check
```bash
npm run dev
```
- `/admin/login`: sign in as the demo admin; Overview, Elections, Candidates, Parties, Voters and Admins should all load.
- `/vote`: sign in as the demo voter; the 6-digit code appears in the `npm run dev` terminal; the face check passes while `FACE_SERVICE_MOCK=true`.
- `/results`: votes appear live.
- **Advisors → Security Advisor**: should show no errors.
