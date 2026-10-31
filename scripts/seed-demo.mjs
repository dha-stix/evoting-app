// Creates demo accounts and data so every page can be tried.
//   npm run seed:demo
// Needs the migration and seed.sql applied, and in .env.local:
// NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and NIN_PEPPER.
// Safe to run again: it updates what already exists.

import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Demo accounts. Change these before running if you deploy the demo publicly.
// ---------------------------------------------------------------------------
export const DEMO_ADMIN = {
	email: process.env.DEMO_ADMIN_EMAIL ?? "admin@demo.authvote.local",
	password: process.env.DEMO_ADMIN_PASSWORD ?? "AuthVote-Demo-2026!",
	full_name: "Demo Admin",
};

// Codes for addresses at demo.authvote.local are printed in the server log
// instead of being emailed. Set DEMO_VOTER_EMAIL to a real inbox to receive them.
export const DEMO_VOTER = {
	vin: "DEMO-VOTE-2026",
	nin: "12345678901",
	date_of_birth: "1998-04-12",
	email: (process.env.DEMO_VOTER_EMAIL ?? "voter@demo.authvote.local").toLowerCase(),
	first_name: "Adaeze",
	middle_name: "Ngozi",
	last_name: "Okafor",
	gender: "female",
	phone: "+2348031234567",
	occupation: "Software engineer",
	origin_state: "Anambra",
	origin_lga: "Onitsha North",
	home_address: "14 Oba Adesida Road",
	home_state: "Ondo",
	home_lga: "Akure South",
	district: "central",
};

// Sample candidates for the demo elections (not real people).
const CANDIDATES = [
	{ full_name: "Adebayo Okonkwo", party: "APC", type: "governorship", district: null, running_mate: "Kemi Adeleke" },
	{ full_name: "Titilayo Bello", party: "PDP", type: "governorship", district: null, running_mate: "Musa Ibrahim" },
	{ full_name: "Funmilayo Adeyemi", party: "LP", type: "governorship", district: null, running_mate: "Chidi Nnaji" },
	{ full_name: "Chinedu Eze", party: "ADC", type: "governorship", district: null, running_mate: "Bola Ajayi" },
	{ full_name: "Olumide Fashola", party: "APC", type: "senatorial", district: "central" },
	{ full_name: "Ngozi Akande", party: "PDP", type: "senatorial", district: "central" },
	{ full_name: "Ibrahim Lawal", party: "LP", type: "senatorial", district: "central" },
	{ full_name: "Kehinde Ojo", party: "APC", type: "senatorial", district: "north" },
	{ full_name: "Aisha Danladi", party: "ADC", type: "senatorial", district: "north" },
];

// ---------------------------------------------------------------------------

const need = (name) => {
	const v = process.env[name];
	if (!v) {
		console.error(`Missing ${name} in .env.local`);
		process.exit(1);
	}
	return v;
};

const db = createClient(need("NEXT_PUBLIC_SUPABASE_URL"), need("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
const pepper = need("NIN_PEPPER");
const hours = (h) => new Date(Date.now() + h * 3600_000).toISOString();
const check = (label, { error }) => {
	if (error) throw new Error(`${label}: ${error.message}`);
};

async function seedAdmin() {
	const { data: list, error } = await db.auth.admin.listUsers({ perPage: 1000 });
	if (error) throw error;
	let user = list.users.find((u) => u.email === DEMO_ADMIN.email);
	if (user) {
		check("update admin password", await db.auth.admin.updateUserById(user.id, { password: DEMO_ADMIN.password, email_confirm: true }));
	} else {
		const created = await db.auth.admin.createUser({ email: DEMO_ADMIN.email, password: DEMO_ADMIN.password, email_confirm: true });
		check("create admin", created);
		user = created.data.user;
	}
	check("admin profile", await db.from("admins").upsert({ id: user.id, email: DEMO_ADMIN.email, full_name: DEMO_ADMIN.full_name, role: "super_admin" }));
}

async function seedCandidates() {
	const { data: parties } = await db.from("parties").select("id, acronym");
	const partyId = Object.fromEntries((parties ?? []).map((p) => [p.acronym, p.id]));
	const ids = {};
	for (const c of CANDIDATES) {
		if (!partyId[c.party]) throw new Error(`Party ${c.party} missing: run supabase/seed.sql first`);
		let q = db.from("candidates").select("id").eq("type", c.type).eq("party_id", partyId[c.party]);
		q = c.district ? q.eq("district", c.district) : q.is("district", null);
		const { data: existing } = await q.maybeSingle();
		const row = { full_name: c.full_name, party_id: partyId[c.party], type: c.type, district: c.district, running_mate: c.running_mate ?? null };
		if (existing) {
			check("update candidate", await db.from("candidates").update(row).eq("id", existing.id));
			ids[c.full_name] = existing.id;
		} else {
			const { data, error } = await db.from("candidates").insert(row).select("id").single();
			if (error) throw error;
			ids[c.full_name] = data.id;
		}
	}
	return ids;
}

async function seedVoter() {
	const photoPath = "demo-voter.jpg";
	check(
		"upload demo photo",
		await db.storage.from("voter-photos").upload(photoPath, readFileSync(new URL("../images/passport.jpg", import.meta.url)), { contentType: "image/jpeg", upsert: true }),
	);
	const { vin, nin, ...rest } = DEMO_VOTER;
	const record = { ...rest, vin, nin_hash: createHmac("sha256", pepper).update(`nin:${nin}`).digest("hex"), nin_last4: nin.slice(-4), photo_path: photoPath, status: "active" };

	const { data: existing } = await db.from("voters").select("id").eq("vin", vin).maybeSingle();
	if (existing) {
		check("update demo voter", await db.from("voters").update(record).eq("id", existing.id));
		return existing.id;
	}
	// Placeholder face template. With FACE_SERVICE_MOCK=true (development) the
	// face check passes for the demo voter; to test real matching, register yourself.
	const embedding = `[${Array.from({ length: 512 }, (_, i) => (i === 0 ? 1 : 0)).join(",")}]`;
	const { data, error } = await db.rpc("register_voter", { p_voter: record, p_embedding: embedding, p_model: "demo", p_quality: 1 });
	if (error) throw error;
	return data;
}

async function upsertElection({ title, type, district, starts_at, ends_at, candidateIds, tallies }) {
	const { data: existing } = await db.from("elections").select("id").eq("title", title).maybeSingle();
	let id = existing?.id;
	const row = { title, type, district, starts_at, ends_at, is_draft: false, description: "Demo election for trying AuthVote." };
	if (id) {
		check(`update ${title}`, await db.from("elections").update(row).eq("id", id));
	} else {
		const { data, error } = await db.from("elections").insert(row).select("id").single();
		if (error) throw new Error(`${title}: ${error.message}${error.code === "23P01" ? " (another election for this office overlaps; end or delete it first)" : ""}`);
		id = data.id;
	}
	const { error } = await db.from("election_candidates").upsert(candidateIds.map((candidate_id) => ({ election_id: id, candidate_id })), { ignoreDuplicates: true });
	if (error && !error.message.includes("ELECTION_LOCKED")) throw error;
	for (const [candidate_id, votes] of Object.entries(tallies ?? {})) {
		check("set tally", await db.from("election_tallies").update({ votes }).eq("election_id", id).eq("candidate_id", Number(candidate_id)));
	}
	return id;
}

async function main() {
	await seedAdmin();
	const c = await seedCandidates();
	await seedVoter();

	await upsertElection({
		title: "Demo · Ondo Governorship",
		type: "governorship",
		district: null,
		starts_at: hours(-1),
		ends_at: hours(24 * 14),
		candidateIds: [c["Adebayo Okonkwo"], c["Titilayo Bello"], c["Funmilayo Adeyemi"], c["Chinedu Eze"]],
	});
	await upsertElection({
		title: "Demo · Senatorial · Ondo Central",
		type: "senatorial",
		district: "central",
		starts_at: hours(-1),
		ends_at: hours(24 * 14),
		candidateIds: [c["Olumide Fashola"], c["Ngozi Akande"], c["Ibrahim Lawal"]],
	});
	await upsertElection({
		title: "Demo · Senatorial · Ondo North (past)",
		type: "senatorial",
		district: "north",
		starts_at: hours(-24 * 30),
		ends_at: hours(-24 * 30 + 10),
		candidateIds: [c["Kehinde Ojo"], c["Aisha Danladi"]],
		tallies: { [c["Kehinde Ojo"]]: 18240, [c["Aisha Danladi"]]: 12975 },
	});

	console.log(`
Demo data is ready.

Admin    /admin/login   ${DEMO_ADMIN.email}  (password in scripts/seed-demo.mjs)
Voter    /vote          VIN ${DEMO_VOTER.vin}, NIN ${DEMO_VOTER.nin}, born ${DEMO_VOTER.date_of_birth}
                        Sign-in code: ${DEMO_VOTER.email.endsWith("@demo.authvote.local") ? "printed in the `npm run dev` terminal" : `emailed to ${DEMO_VOTER.email}`}
                        Face check: set FACE_SERVICE_MOCK=true in .env.local (development)
Card     /card          VIN ${DEMO_VOTER.vin} + date of birth
`);
}

main().catch((e) => {
	console.error(e.message ?? e);
	process.exit(1);
});
