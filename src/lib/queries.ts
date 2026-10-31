import "server-only";
import type { Admin, AuditEntry, Candidate, Election, Party, Tally, Turnout, VoterRow } from "@/types";
import { createServiceClient, createSessionClient } from "./supabase";
import { electionStatus } from "./utils";

/** Elections with their candidates (and parties) and current tallies. */
export interface ElectionWithBallot extends Election {
	candidates: Candidate[];
	tallies: Tally[];
}

const ELECTION_SELECT = "*, election_candidates(candidate:candidates(*, party:parties(*))), election_tallies(*)";

type RawElection = Election & {
	election_candidates: { candidate: Candidate }[];
	election_tallies: Tally[];
};

const shape = (rows: RawElection[] | null): ElectionWithBallot[] =>
	(rows ?? []).map(({ election_candidates, election_tallies, ...e }) => ({
		...e,
		candidates: election_candidates.map((ec) => ec.candidate).sort((a, b) => a.party!.acronym.localeCompare(b.party!.acronym)),
		tallies: election_tallies,
	}));

export async function getPublicElections() {
	const db = createSessionClient();
	const { data } = await db.from("elections").select(ELECTION_SELECT).eq("is_draft", false).order("starts_at", { ascending: false }).limit(30);
	return shape(data as RawElection[] | null);
}

export async function getTurnout(electionId: number): Promise<Turnout | null> {
	const { data } = await createSessionClient().rpc("election_turnout", { p_election: electionId });
	return (data as Turnout | null) ?? null;
}

/** Open ballots for a signed-in voter that they have not voted in yet. */
export async function getBallotsForVoter(voterId: string) {
	const db = createServiceClient();
	const now = new Date().toISOString();
	const { data: voter } = await db.from("voters").select("first_name, last_name, district, home_lga, status").eq("id", voterId).single();
	if (!voter || voter.status !== "active") return null;
	const [{ data: elections }, { data: voted }] = await Promise.all([
		db.from("elections").select(ELECTION_SELECT).eq("is_draft", false).lte("starts_at", now).gt("ends_at", now),
		db.from("participation").select("election_id").eq("voter_id", voterId),
	]);
	const done = new Set((voted ?? []).map((v) => v.election_id as number));
	const ballots = shape(elections as RawElection[] | null)
		.filter((e) => e.type === "governorship" || e.district === voter.district)
		.map(({ tallies: _tallies, ...e }) => ({ ...e, voted: done.has(e.id) }));
	return { voter, ballots };
}

export async function getParties(): Promise<Party[]> {
	const { data } = await createSessionClient().from("parties").select("*").order("name");
	return (data as Party[]) ?? [];
}

export async function getPartiesWithCounts() {
	const { data } = await createSessionClient().from("parties").select("*, candidates(count)").order("name");
	return ((data ?? []) as (Party & { candidates: { count: number }[] })[]).map(({ candidates, ...p }) => ({ ...p, candidateCount: candidates[0]?.count ?? 0 }));
}

export async function getCandidates(): Promise<Candidate[]> {
	const { data } = await createSessionClient().from("candidates").select("*, party:parties(*)").order("full_name");
	return (data as Candidate[]) ?? [];
}

export async function getAdminElections() {
	const db = createSessionClient();
	const { data } = await db.from("elections").select(ELECTION_SELECT).order("starts_at", { ascending: false });
	return shape(data as RawElection[] | null).map((e) => ({ ...e, status: electionStatus(e) }));
}

export interface Overview {
	voters: number;
	face_enrolled: number;
	parties: number;
	registrations: { day: string; count: number }[];
	verifications_today: { total: number; success: number };
	participation: Record<string, number>;
}

export async function getOverview() {
	const db = createSessionClient();
	const [{ data: overview }, elections, { data: audit }] = await Promise.all([
		db.rpc("admin_overview"),
		getAdminElections(),
		db.from("audit_log").select("*").order("created_at", { ascending: false }).limit(6),
	]);
	return { overview: overview as Overview, elections, audit: (audit as AuditEntry[]) ?? [] };
}

export async function getVoters(params: { q?: string; lga?: string; status?: string; page?: number }) {
	const pageSize = 20;
	const page = Math.max(1, params.page ?? 1);
	let query = createSessionClient()
		.from("voters")
		.select("id, vin, first_name, middle_name, last_name, date_of_birth, gender, email, nin_last4, home_lga, district, status, created_at", { count: "exact" })
		.order("created_at", { ascending: false })
		.range((page - 1) * pageSize, page * pageSize - 1);

	const q = params.q?.trim();
	if (q) {
		const vinLike = q.toUpperCase().replace(/[^A-Z0-9-]/g, "");
		if (/^\d{4}$/.test(q)) query = query.eq("nin_last4", q);
		else if (/^[A-Z0-9]{4}-/.test(vinLike)) query = query.ilike("vin", `${vinLike}%`);
		else {
			const safe = q.replace(/[%,()]/g, "");
			query = query.or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,email.ilike.%${safe}%`);
		}
	}
	if (params.lga) query = query.eq("home_lga", params.lga);
	if (params.status === "active" || params.status === "suspended") query = query.eq("status", params.status);

	const { data, count } = await query;
	return { voters: (data as VoterRow[]) ?? [], total: count ?? 0, page, pageSize };
}

export async function getTeam() {
	const db = createSessionClient();
	const [{ data: admins }, { data: audit }] = await Promise.all([
		db.from("admins").select("*").order("created_at"),
		db.from("audit_log").select("*").order("created_at", { ascending: false }).limit(40),
	]);
	return { admins: (admins as Admin[]) ?? [], audit: (audit as AuditEntry[]) ?? [] };
}
