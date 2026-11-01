export type AdminRole = "super_admin" | "officer" | "observer";
export type ElectionType = "governorship" | "senatorial";
export type District = "north" | "central" | "south";
export type ElectionStatus = "draft" | "scheduled" | "live" | "ended";

export interface Party {
	id: number;
	name: string;
	acronym: string;
	color: string;
	logo_path: string | null;
}

export interface Candidate {
	id: number;
	full_name: string;
	party_id: number;
	type: ElectionType;
	district: District | null;
	running_mate: string | null;
	photo_path: string | null;
	party?: Party;
}

export interface Election {
	id: number;
	title: string;
	type: ElectionType;
	district: District | null;
	description: string | null;
	starts_at: string;
	ends_at: string;
	ended_early_at: string | null;
	is_draft: boolean;
	created_at: string;
}

export interface Tally {
	election_id: number;
	candidate_id: number;
	votes: number;
}

export interface Turnout {
	voted: number;
	eligible: number;
	by_district: { district: District; voted: number; eligible: number }[];
	by_lga?: { lga: string; district: District; voted: number; eligible: number }[];
}

export interface VoterRow {
	id: string;
	vin: string;
	first_name: string;
	middle_name: string | null;
	last_name: string;
	date_of_birth: string;
	gender: "female" | "male";
	email: string;
	nin_last4: string;
	home_lga: string;
	district: District;
	status: "active" | "suspended";
	created_at: string;
}

export interface Admin {
	id: string;
	full_name: string;
	email: string;
	role: AdminRole;
	created_at: string;
}

export interface AuditEntry {
	id: number;
	actor_email: string | null;
	action: string;
	entity: string | null;
	entity_id: string | null;
	details: Record<string, unknown>;
	created_at: string;
}

export interface VoterCard {
	vin: string;
	first_name: string;
	middle_name: string | null;
	last_name: string;
	date_of_birth: string;
	gender: string;
	home_lga: string;
	district: District;
	created_at: string;
	photo_url: string | null;
	verify_url: string;
}

/** Result shape every server action returns. */
export type ActionResult<T = undefined> =
	| ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
	| { ok: false; error: string; field?: string };

/** One captured camera frame plus where it was taken in the liveness flow. */
export interface FaceFrame {
	kind: "front" | "turn" | "front2";
	dataUrl: string;
}
