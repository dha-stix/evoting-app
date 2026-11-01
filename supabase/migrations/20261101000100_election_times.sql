-- Elections can only be scheduled for now or later, judged by the database
-- server's clock. Ending early (which sets ended_early_at) is still allowed.

create or replace function public.guard_election_times() returns trigger
language plpgsql set search_path = '' as $$
begin
	-- A few minutes of grace for "open voting now" requests in flight.
	if (tg_op = 'INSERT' or new.starts_at is distinct from old.starts_at)
		and new.starts_at < now() - interval '5 minutes' then
		raise exception 'START_IN_PAST';
	end if;
	if tg_op = 'UPDATE' and old.is_draft and not new.is_draft
		and new.starts_at < now() - interval '5 minutes' then
		raise exception 'START_IN_PAST';
	end if;
	if (tg_op = 'INSERT' or new.ends_at is distinct from old.ends_at)
		and new.ends_at <= now() and new.ended_early_at is null then
		raise exception 'END_IN_PAST';
	end if;
	return new;
end;
$$;

drop trigger if exists elections_guard_times on public.elections;
create trigger elections_guard_times
	before insert or update on public.elections
	for each row execute function public.guard_election_times();
