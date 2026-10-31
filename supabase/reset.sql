-- Removes everything the AuthVote migration creates so it can be run again
-- from the top. Use only on a project set up for AuthVote: it deletes all
-- AuthVote data (voters, elections, votes, admins). Storage buckets are kept.

drop policy if exists "managers upload catalogue images" on storage.objects;
drop policy if exists "managers replace catalogue images" on storage.objects;
drop policy if exists "managers delete catalogue images" on storage.objects;

drop table if exists
	public.audit_log,
	public.verification_attempts,
	public.face_challenges,
	public.otp_codes,
	public.votes,
	public.participation,
	public.election_tallies,
	public.election_candidates,
	public.elections,
	public.face_templates,
	public.voters,
	public.candidates,
	public.parties,
	public.admins
cascade;

do $$
declare
	f record;
begin
	for f in
		select p.oid::regprocedure as sig
		from pg_proc p join pg_namespace n on n.oid = p.pronamespace
		where n.nspname = 'public' and p.proname in (
			'office_key', 'is_admin', 'can_manage', 'is_super_admin', 'guard_election_candidates',
			'register_voter', 'match_face', 'face_similarity', 'cast_vote', 'election_turnout',
			'check_receipt', 'admin_overview', 'voter_participation'
		)
	loop
		execute format('drop function if exists %s cascade', f.sig);
	end loop;
end;
$$;

drop type if exists public.admin_role, public.election_type, public.senatorial_district, public.voter_status cascade;
