-- Parties registered with INEC (https://inecnigeria.org/parties).
-- Colours are used for badges until each party's official logo is uploaded
-- from the admin Parties page (or dropped into /images/parties).
insert into public.parties (name, acronym, color) values
	('All Progressives Congress', 'APC', '#1D4ED8'),
	('Peoples Democratic Party', 'PDP', '#C1121F'),
	('African Democratic Congress', 'ADC', '#0E7490'),
	('Labour Party', 'LP', '#15803D'),
	('New Nigeria Peoples Party', 'NNPP', '#9D174D'),
	('All Progressives Grand Alliance', 'APGA', '#A16207'),
	('Social Democratic Party', 'SDP', '#C2410C'),
	('Young Progressives Party', 'YPP', '#6D28D9'),
	('Accord', 'A', '#0F766E'),
	('Action Alliance', 'AA', '#4D7C0F'),
	('African Action Congress', 'AAC', '#B91C1C'),
	('Action Democratic Party', 'ADP', '#1E40AF'),
	('Allied Peoples Movement', 'APM', '#7E22CE'),
	('Action Peoples Party', 'APP', '#BE185D'),
	('Boot Party', 'BP', '#374151'),
	('National Rescue Movement', 'NRM', '#065F46'),
	('Peoples Redemption Party', 'PRP', '#991B1B'),
	('Youth Party', 'YP', '#0369A1'),
	('Zenith Labour Party', 'ZLP', '#854D0E'),
	('Democratic Leadership Alliance', 'DLA', '#9F1239'),
	('Nigeria Democratic Congress', 'NDC', '#155E75')
on conflict (acronym) do nothing;

-- Make yourself the first super admin after creating your account in
-- Supabase Auth (Dashboard → Authentication → Add user):
--
-- insert into public.admins (id, full_name, email, role)
-- select id, 'Your Name', email, 'super_admin' from auth.users where email = 'you@example.com';
