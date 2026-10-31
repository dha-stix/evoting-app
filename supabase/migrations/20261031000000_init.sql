-- AuthVote schema
-- Voters, face templates and ballots are only ever written by the server
-- (service role). Admin screens read through row-level security.

create extension if not exists vector with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.admin_role as enum ('super_admin', 'officer', 'observer');
create type public.election_type as enum ('governorship', 'senatorial');
create type public.senatorial_district as enum ('north', 'central', 'south');
create type public.voter_status as enum ('active', 'suspended');

-- Office key used in unique indexes and the overlap constraint. Enum-to-text
-- casts are only "stable" in Postgres, so they cannot appear in an index
-- directly; this wrapper is safe to mark immutable because enum labels here
-- never change.
create or replace function public.office_key(p_type public.election_type, p_district public.senatorial_district)
returns text
language sql immutable parallel safe set search_path = '' as $$
	select p_type::text || ':' || coalesce(p_district::text, 'state');
$$;

-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------
create table public.admins (
	id uuid primary key references auth.users (id) on delete cascade,
	full_name text not null,
	email text not null unique,
	role public.admin_role not null default 'observer',
	created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
	select exists (select 1 from admins where id = auth.uid());
$$;

create or replace function public.can_manage() returns boolean
language sql stable security definer set search_path = public as $$
	select exists (select 1 from admins where id = auth.uid() and role in ('super_admin', 'officer'));
$$;

create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
	select exists (select 1 from admins where id = auth.uid() and role = 'super_admin');
$$;

-- ---------------------------------------------------------------------------
-- Parties and candidates
-- ---------------------------------------------------------------------------
create table public.parties (
	id bigint generated always as identity primary key,
	name text not null unique,
	acronym text not null unique check (acronym ~ '^[A-Z0-9]{1,8}$'),
	color text not null default '#0A6B3D' check (color ~ '^#[0-9A-Fa-f]{6}$'),
	logo_path text,
	created_at timestamptz not null default now()
);

create table public.candidates (
	id bigint generated always as identity primary key,
	full_name text not null check (char_length(full_name) between 3 and 120),
	party_id bigint not null references public.parties (id) on delete restrict,
	type public.election_type not null,
	district public.senatorial_district,
	running_mate text,
	photo_path text,
	created_at timestamptz not null default now(),
	check ((type = 'senatorial') = (district is not null))
);

-- One candidate per party for each office.
create unique index candidates_one_per_party
	on public.candidates (public.office_key(type, district), party_id);

-- ---------------------------------------------------------------------------
-- Voters and face templates
-- ---------------------------------------------------------------------------
create table public.voters (
	id uuid primary key default gen_random_uuid(),
	vin text not null unique check (vin ~ '^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$'),
	first_name text not null,
	middle_name text,
	last_name text not null,
	date_of_birth date not null check (date_of_birth <= current_date - interval '18 years'),
	gender text not null check (gender in ('female', 'male')),
	email text not null unique check (email = lower(email)),
	phone text not null,
	nin_hash text not null unique,
	nin_last4 text not null check (nin_last4 ~ '^[0-9]{4}$'),
	occupation text not null,
	origin_state text not null,
	origin_lga text not null,
	home_address text not null,
	home_state text not null,
	home_lga text not null,
	district public.senatorial_district not null,
	photo_path text not null,
	status public.voter_status not null default 'active',
	created_at timestamptz not null default now()
);

create index voters_created_at_idx on public.voters (created_at desc);
create index voters_home_lga_idx on public.voters (home_lga);

create table public.face_templates (
	voter_id uuid primary key references public.voters (id) on delete cascade,
	embedding extensions.vector(512) not null,
	model text not null,
	quality real,
	created_at timestamptz not null default now()
);

create index face_templates_embedding_idx
	on public.face_templates using hnsw (embedding extensions.vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- Elections
-- ---------------------------------------------------------------------------
create table public.elections (
	id bigint generated always as identity primary key,
	title text not null check (char_length(title) between 3 and 140),
	type public.election_type not null,
	district public.senatorial_district,
	description text,
	starts_at timestamptz not null,
	ends_at timestamptz not null,
	ended_early_at timestamptz,
	is_draft boolean not null default false,
	created_by uuid references public.admins (id) on delete set null,
	created_at timestamptz not null default now(),
	check (ends_at > starts_at),
	check ((type = 'senatorial') = (district is not null)),
	-- Two published elections for the same office can never overlap in time.
	constraint elections_no_overlap exclude using gist (
		public.office_key(type, district) with =,
		tstzrange(starts_at, ends_at) with &&
	) where (not is_draft)
);

create table public.election_candidates (
	election_id bigint not null references public.elections (id) on delete cascade,
	candidate_id bigint not null references public.candidates (id) on delete restrict,
	primary key (election_id, candidate_id)
);

-- Public, realtime running totals. Only cast_vote() changes them.
create table public.election_tallies (
	election_id bigint not null references public.elections (id) on delete cascade,
	candidate_id bigint not null references public.candidates (id) on delete restrict,
	votes integer not null default 0 check (votes >= 0),
	primary key (election_id, candidate_id)
);

-- Who has voted. Stores the day only, never the time or the choice.
create table public.participation (
	election_id bigint not null references public.elections (id) on delete cascade,
	voter_id uuid not null references public.voters (id) on delete cascade,
	voted_on date not null default current_date,
	primary key (election_id, voter_id)
);

-- What was voted. No voter column, random ids and an hour-level timestamp so a
-- ballot cannot be linked back to a participation row.
create table public.votes (
	id uuid primary key default gen_random_uuid(),
	election_id bigint not null references public.elections (id) on delete cascade,
	candidate_id bigint not null references public.candidates (id) on delete restrict,
	receipt_code text not null unique,
	cast_hour timestamptz not null default date_trunc('hour', now())
);

create index votes_election_idx on public.votes (election_id);

-- The ballot list is frozen as soon as anyone has voted.
create or replace function public.guard_election_candidates() returns trigger
language plpgsql security definer set search_path = public as $$
begin
	if exists (select 1 from participation where election_id = coalesce(new.election_id, old.election_id)) then
		raise exception 'ELECTION_LOCKED';
	end if;
	if tg_op = 'INSERT' then
		insert into election_tallies (election_id, candidate_id) values (new.election_id, new.candidate_id)
		on conflict do nothing;
		return new;
	end if;
	delete from election_tallies where election_id = old.election_id and candidate_id = old.candidate_id;
	return old;
end;
$$;

create trigger election_candidates_guard
	before insert or delete on public.election_candidates
	for each row execute function public.guard_election_candidates();

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
create table public.otp_codes (
	id uuid primary key default gen_random_uuid(),
	voter_id uuid not null references public.voters (id) on delete cascade,
	code_hash text not null,
	expires_at timestamptz not null,
	attempts integer not null default 0,
	consumed_at timestamptz,
	created_at timestamptz not null default now()
);

create index otp_codes_voter_idx on public.otp_codes (voter_id, created_at desc);

-- A liveness challenge issued by the server: the head turn it asks for is
-- random, so a pre-recorded clip cannot know which way to turn.
create table public.face_challenges (
	id uuid primary key default gen_random_uuid(),
	voter_id uuid references public.voters (id) on delete cascade,
	purpose text not null check (purpose in ('register', 'vote')),
	direction text not null check (direction in ('left', 'right')),
	expires_at timestamptz not null,
	consumed_at timestamptz,
	created_at timestamptz not null default now()
);

create table public.verification_attempts (
	id bigint generated always as identity primary key,
	voter_id uuid references public.voters (id) on delete cascade,
	success boolean not null,
	similarity real,
	reason text,
	created_at timestamptz not null default now()
);

create index verification_attempts_voter_idx on public.verification_attempts (voter_id, created_at desc);

create table public.audit_log (
	id bigint generated always as identity primary key,
	actor_id uuid references public.admins (id) on delete set null,
	actor_email text,
	action text not null,
	entity text,
	entity_id text,
	details jsonb not null default '{}',
	created_at timestamptz not null default now()
);

create index audit_log_created_idx on public.audit_log (created_at desc);

-- ---------------------------------------------------------------------------
-- Server-only functions (service role)
-- ---------------------------------------------------------------------------
create or replace function public.register_voter(p_voter jsonb, p_embedding extensions.vector(512), p_model text, p_quality real)
returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare
	v_id uuid;
begin
	insert into voters (
		vin, first_name, middle_name, last_name, date_of_birth, gender, email, phone, nin_hash, nin_last4,
		occupation, origin_state, origin_lga, home_address, home_state, home_lga, district, photo_path
	) values (
		p_voter->>'vin', p_voter->>'first_name', nullif(p_voter->>'middle_name', ''), p_voter->>'last_name',
		(p_voter->>'date_of_birth')::date, p_voter->>'gender', lower(p_voter->>'email'), p_voter->>'phone',
		p_voter->>'nin_hash', p_voter->>'nin_last4', p_voter->>'occupation', p_voter->>'origin_state',
		p_voter->>'origin_lga', p_voter->>'home_address', p_voter->>'home_state', p_voter->>'home_lga',
		(p_voter->>'district')::senatorial_district, p_voter->>'photo_path'
	) returning id into v_id;

	insert into face_templates (voter_id, embedding, model, quality) values (v_id, p_embedding, p_model, p_quality);
	return v_id;
end;
$$;

create or replace function public.match_face(p_embedding extensions.vector(512), p_min_similarity double precision, p_limit integer default 3)
returns table (voter_id uuid, similarity double precision)
language sql stable security definer set search_path = public, extensions as $$
	select f.voter_id, 1 - (f.embedding <=> p_embedding) as similarity
	from face_templates f
	where 1 - (f.embedding <=> p_embedding) >= p_min_similarity
	order by f.embedding <=> p_embedding
	limit p_limit;
$$;

create or replace function public.face_similarity(p_voter uuid, p_embedding extensions.vector(512))
returns double precision
language sql stable security definer set search_path = public, extensions as $$
	select 1 - (embedding <=> p_embedding) from face_templates where voter_id = p_voter;
$$;

-- Records participation and the anonymous ballot in one transaction. The
-- participation primary key makes a second vote impossible.
create or replace function public.cast_vote(p_election bigint, p_voter uuid, p_candidate bigint)
returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
	v_election elections;
	v_voter voters;
	v_raw text;
	v_receipt text;
begin
	select * into v_election from elections where id = p_election;
	if not found or v_election.is_draft or now() < v_election.starts_at or now() >= v_election.ends_at then
		raise exception 'ELECTION_CLOSED';
	end if;

	select * into v_voter from voters where id = p_voter;
	if not found or v_voter.status <> 'active'
		or (v_election.type = 'senatorial' and v_election.district <> v_voter.district) then
		raise exception 'VOTER_INELIGIBLE';
	end if;

	if not exists (select 1 from election_candidates where election_id = p_election and candidate_id = p_candidate) then
		raise exception 'INVALID_CANDIDATE';
	end if;

	begin
		insert into participation (election_id, voter_id) values (p_election, p_voter);
	exception when unique_violation then
		raise exception 'ALREADY_VOTED';
	end;

	v_raw := upper(encode(gen_random_bytes(5), 'hex'));
	v_receipt := 'AV-' || substr(v_raw, 1, 5) || '-' || substr(v_raw, 6, 5);
	insert into votes (election_id, candidate_id, receipt_code) values (p_election, p_candidate, v_receipt);
	update election_tallies set votes = votes + 1 where election_id = p_election and candidate_id = p_candidate;
	return v_receipt;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public read functions
-- ---------------------------------------------------------------------------
create or replace function public.election_turnout(p_election bigint)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
	v_election elections;
begin
	select * into v_election from elections where id = p_election and not is_draft;
	if not found then
		return null;
	end if;
	return jsonb_build_object(
		'voted', (select count(*) from participation where election_id = p_election),
		'eligible', (select count(*) from voters where status = 'active'
			and (v_election.type = 'governorship' or district = v_election.district)),
		'by_district', (
			select coalesce(jsonb_agg(jsonb_build_object('district', d.district, 'voted', d.voted, 'eligible', d.eligible) order by d.district), '[]'::jsonb)
			from (
				select v.district,
					count(p.voter_id) as voted,
					count(*) as eligible
				from voters v
				left join participation p on p.voter_id = v.id and p.election_id = p_election
				where v.status = 'active' and (v_election.type = 'governorship' or v.district = v_election.district)
				group by v.district
			) d
		)
	);
end;
$$;

create or replace function public.check_receipt(p_code text)
returns jsonb
language sql stable security definer set search_path = public as $$
	select jsonb_build_object('election', e.title, 'counted', true)
	from votes v join elections e on e.id = v.election_id
	where v.receipt_code = upper(trim(p_code));
$$;

create or replace function public.admin_overview()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
	if not is_admin() then
		raise exception 'FORBIDDEN';
	end if;
	return jsonb_build_object(
		'voters', (select count(*) from voters),
		'face_enrolled', (select count(*) from face_templates),
		'parties', (select count(*) from parties),
		'registrations', (
			select jsonb_agg(jsonb_build_object('day', d::date, 'count',
				(select count(*) from voters where created_at >= d and created_at < d + interval '1 day')) order by d)
			from generate_series((current_date - 13)::timestamp, current_date::timestamp, interval '1 day') d
		),
		'verifications_today', (
			select jsonb_build_object('total', count(*), 'success', count(*) filter (where success))
			from verification_attempts where created_at >= current_date
		),
		'participation', (
			select coalesce(jsonb_object_agg(election_id, voted), '{}'::jsonb)
			from (select election_id, count(*) as voted from participation group by election_id) x
		)
	);
end;
$$;

create or replace function public.voter_participation(p_voter uuid)
returns table (election_id bigint, title text, voted boolean)
language plpgsql stable security definer set search_path = public as $$
begin
	if not is_admin() then
		raise exception 'FORBIDDEN';
	end if;
	return query
		select e.id, e.title, exists (select 1 from participation p where p.election_id = e.id and p.voter_id = p_voter)
		from elections e join voters v on v.id = p_voter
		where not e.is_draft and now() >= e.starts_at
			and (e.type = 'governorship' or e.district = v.district)
		order by e.starts_at desc
		limit 10;
end;
$$;

revoke all on function public.register_voter(jsonb, extensions.vector, text, real) from public, anon, authenticated;
revoke all on function public.match_face(extensions.vector, double precision, integer) from public, anon, authenticated;
revoke all on function public.face_similarity(uuid, extensions.vector) from public, anon, authenticated;
revoke all on function public.cast_vote(bigint, uuid, bigint) from public, anon, authenticated;
grant execute on function public.register_voter(jsonb, extensions.vector, text, real) to service_role;
grant execute on function public.match_face(extensions.vector, double precision, integer) to service_role;
grant execute on function public.face_similarity(uuid, extensions.vector) to service_role;
grant execute on function public.cast_vote(bigint, uuid, bigint) to service_role;

revoke all on function public.admin_overview() from public, anon;
revoke all on function public.voter_participation(uuid) from public, anon;
grant execute on function public.admin_overview() to authenticated;
grant execute on function public.voter_participation(uuid) to authenticated;
grant execute on function public.election_turnout(bigint) to anon, authenticated;
grant execute on function public.check_receipt(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.admins enable row level security;
alter table public.parties enable row level security;
alter table public.candidates enable row level security;
alter table public.voters enable row level security;
alter table public.face_templates enable row level security;
alter table public.elections enable row level security;
alter table public.election_candidates enable row level security;
alter table public.election_tallies enable row level security;
alter table public.participation enable row level security;
alter table public.votes enable row level security;
alter table public.otp_codes enable row level security;
alter table public.face_challenges enable row level security;
alter table public.verification_attempts enable row level security;
alter table public.audit_log enable row level security;

-- Admins
create policy "admins read team" on public.admins for select to authenticated using (public.is_admin());
create policy "super admins update team" on public.admins for update to authenticated
	using (public.is_super_admin()) with check (public.is_super_admin());
create policy "super admins remove team" on public.admins for delete to authenticated
	using (public.is_super_admin() and id <> auth.uid());

-- Public catalogue
create policy "anyone reads parties" on public.parties for select to anon, authenticated using (true);
create policy "managers write parties" on public.parties for all to authenticated
	using (public.can_manage()) with check (public.can_manage());

create policy "anyone reads candidates" on public.candidates for select to anon, authenticated using (true);
create policy "managers write candidates" on public.candidates for all to authenticated
	using (public.can_manage()) with check (public.can_manage());

create policy "public reads published elections" on public.elections for select to anon using (not is_draft);
create policy "admins read elections" on public.elections for select to authenticated
	using (not is_draft or public.is_admin());
create policy "managers write elections" on public.elections for all to authenticated
	using (public.can_manage()) with check (public.can_manage());

create policy "anyone reads ballot lists" on public.election_candidates for select to anon, authenticated
	using (exists (select 1 from public.elections e where e.id = election_id and (not e.is_draft or public.is_admin())));
create policy "managers write ballot lists" on public.election_candidates for all to authenticated
	using (public.can_manage()) with check (public.can_manage());

create policy "anyone reads tallies" on public.election_tallies for select to anon, authenticated
	using (exists (select 1 from public.elections e where e.id = election_id and not e.is_draft));

-- Voter records: admins read, managers can suspend. Inserts come from the server only.
create policy "admins read voters" on public.voters for select to authenticated using (public.is_admin());
create policy "managers update voters" on public.voters for update to authenticated
	using (public.can_manage()) with check (public.can_manage());

create policy "admins read verification attempts" on public.verification_attempts for select to authenticated using (public.is_admin());
create policy "admins read audit log" on public.audit_log for select to authenticated using (public.is_admin());

-- face_templates, participation, votes, otp_codes and face_challenges have no
-- policies on purpose: only the service role can touch them.

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.election_tallies;
alter publication supabase_realtime add table public.elections;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
	('party-logos', 'party-logos', true, 2097152, array['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']),
	('candidate-photos', 'candidate-photos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
	('voter-photos', 'voter-photos', false, 1048576, array['image/jpeg'])
on conflict (id) do nothing;

create policy "managers upload catalogue images" on storage.objects for insert to authenticated
	with check (bucket_id in ('party-logos', 'candidate-photos') and public.can_manage());
create policy "managers replace catalogue images" on storage.objects for update to authenticated
	using (bucket_id in ('party-logos', 'candidate-photos') and public.can_manage());
create policy "managers delete catalogue images" on storage.objects for delete to authenticated
	using (bucket_id in ('party-logos', 'candidate-photos') and public.can_manage());
-- voter-photos has no policies: the server reads it with signed URLs.
