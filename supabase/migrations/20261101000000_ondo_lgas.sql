-- Ondo State LGAs, grouped by senatorial district.
-- A voter's senatorial district always comes from their LGA of residence, so
-- only residents of a district's LGAs can vote in that district's election.

create table if not exists public.lgas (
	name text primary key,
	headquarters text not null,
	district public.senatorial_district not null
);

insert into public.lgas (name, headquarters, district) values
	-- Ondo North
	('Akoko North-East', 'Ikare-Akoko', 'north'),
	('Akoko North-West', 'Oke-Agbe', 'north'),
	('Akoko South-East', 'Isua', 'north'),
	('Akoko South-West', 'Oka', 'north'),
	('Ose', 'Ifon', 'north'),
	('Owo', 'Owo', 'north'),
	-- Ondo Central
	('Akure North', 'Iju/Itaogbolu', 'central'),
	('Akure South', 'Akure', 'central'),
	('Idanre', 'Owena', 'central'),
	('Ifedore', 'Igbara-Oke', 'central'),
	('Ondo East', 'Bolorunduro', 'central'),
	('Ondo West', 'Ondo', 'central'),
	-- Ondo South
	('Ese Odo', 'Igbekebo', 'south'),
	('Ilaje', 'Igbokoda', 'south'),
	('Ile Oluji/Okeigbo', 'Ile-Oluji', 'south'),
	('Irele', 'Ode-Irele', 'south'),
	('Odigbo', 'Ore', 'south'),
	('Okitipupa', 'Okitipupa', 'south')
on conflict (name) do update set headquarters = excluded.headquarters, district = excluded.district;

alter table public.lgas enable row level security;
drop policy if exists "anyone reads lgas" on public.lgas;
create policy "anyone reads lgas" on public.lgas for select to anon, authenticated using (true);
grant select on public.lgas to anon, authenticated;
grant select, insert, update, delete on public.lgas to service_role;

-- Voters must live in an Ondo LGA; the district is derived from it.
alter table public.voters drop constraint if exists voters_home_lga_fkey;
alter table public.voters add constraint voters_home_lga_fkey foreign key (home_lga) references public.lgas (name) on update cascade;
alter table public.voters drop constraint if exists voters_home_state_ondo;
alter table public.voters add constraint voters_home_state_ondo check (home_state = 'Ondo');

create or replace function public.voter_district_from_lga() returns trigger
language plpgsql set search_path = '' as $$
begin
	select l.district into new.district from public.lgas l where l.name = new.home_lga;
	if new.district is null then
		raise exception 'UNKNOWN_LGA';
	end if;
	return new;
end;
$$;

drop trigger if exists voters_district_from_lga on public.voters;
create trigger voters_district_from_lga
	before insert or update of home_lga, district on public.voters
	for each row execute function public.voter_district_from_lga();

-- Existing rows follow the same rule.
update public.voters v set district = l.district from public.lgas l where l.name = v.home_lga and v.district <> l.district;

-- Turnout now also breaks down by LGA, grouped under each district.
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
				select l.district,
					count(p.voter_id) as voted,
					count(v.id) as eligible
				from lgas l
				left join voters v on v.home_lga = l.name and v.status = 'active'
				left join participation p on p.voter_id = v.id and p.election_id = p_election
				where v_election.type = 'governorship' or l.district = v_election.district
				group by l.district
			) d
		),
		'by_lga', (
			select coalesce(jsonb_agg(jsonb_build_object('lga', x.name, 'district', x.district, 'voted', x.voted, 'eligible', x.eligible) order by x.district, x.name), '[]'::jsonb)
			from (
				select l.name, l.district,
					count(p.voter_id) as voted,
					count(v.id) as eligible
				from lgas l
				left join voters v on v.home_lga = l.name and v.status = 'active'
				left join participation p on p.voter_id = v.id and p.election_id = p_election
				where v_election.type = 'governorship' or l.district = v_election.district
				group by l.name, l.district
			) x
		)
	);
end;
$$;

grant execute on function public.election_turnout(bigint) to anon, authenticated;
