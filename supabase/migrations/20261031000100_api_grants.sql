-- Table privileges for the Supabase API roles. Newer Supabase projects do not
-- grant these automatically, so they are listed explicitly (least privilege;
-- row-level security still decides which rows each role sees).

grant usage on schema public to anon, authenticated, service_role;

-- Server (service role): full access for registration, sign-in and voting.
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Visitors: the public catalogue and live tallies.
grant select on public.parties, public.candidates, public.elections, public.election_candidates, public.election_tallies to anon;

-- Signed-in admins (RLS limits this to admins and, for writes, to managers).
grant select on
	public.admins, public.parties, public.candidates, public.voters, public.elections,
	public.election_candidates, public.election_tallies, public.verification_attempts, public.audit_log
to authenticated;
grant insert, update, delete on public.parties, public.candidates, public.elections, public.election_candidates to authenticated;
grant update on public.voters to authenticated;
grant update, delete on public.admins to authenticated;
grant usage, select on all sequences in schema public to authenticated;
