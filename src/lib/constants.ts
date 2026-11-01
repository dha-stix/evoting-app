import type { District } from "@/types";
import { LGAS_BY_DISTRICT, ONDO_LGAS } from "./data/ondo";
import statesLgas from "./data/states-lgas.json";

export const SITE_NAME = "AuthVote";
export const CREDIT = { name: "David Asaolu", url: "https://www.linkedin.com/in/david-asaolu234/" };

/** Elections on this deployment are run for one state. */
export const ELECTION_STATE = "Ondo";

export const STATES_LGAS = statesLgas as Record<string, string[]>;
export const STATES = Object.keys(STATES_LGAS);

export const DISTRICTS: Record<District, string> = {
	north: "Ondo North",
	central: "Ondo Central",
	south: "Ondo South",
};

/** LGA of residence → senatorial district. */
export const LGA_DISTRICT: Record<string, District> = Object.fromEntries(ONDO_LGAS.map((l) => [l.name, l.district]));

/** "Akure North, Akure South, …" for a district. */
export const districtLgaList = (d: District) => LGAS_BY_DISTRICT[d].map((l) => l.name).join(", ");

export const ELECTION_TYPE_LABEL = { governorship: "Governorship", senatorial: "Senatorial" } as const;

export const ADMIN_ROLE_LABEL = {
	super_admin: "Super admin",
	officer: "Election officer",
	observer: "Observer",
} as const;

export const STORAGE = {
	partyLogos: "party-logos",
	candidatePhotos: "candidate-photos",
	voterPhotos: "voter-photos",
} as const;

export const LIMITS = {
	otpTtlMinutes: 10,
	otpMaxAttempts: 5,
	otpSendsPer15Min: 3,
	challengeTtlMinutes: 5,
	faceAttemptsBeforeLock: 3,
	faceLockMinutes: 30,
	ballotSessionMinutes: 15,
	pendingSessionMinutes: 15,
} as const;
