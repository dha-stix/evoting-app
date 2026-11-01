"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult, AdminRole, FaceFrame, VoterCard } from "@/types";
import { LGA_DISTRICT, LIMITS, STORAGE } from "./constants";
import { generateOtp, generateVin, hashNin, hashOtp, safeEqual } from "./crypto";
import { sendAdminLinkEmail, sendOtpEmail, sendVinEmail } from "./email";
import { FACE, checkLiveness, faceMockEnabled, toPgVector } from "./face";
import { clearVoterSession, readVoterSession, setVoterSession, signCardToken } from "./session";
import { createServiceClient, createSessionClient, getCurrentAdmin } from "./supabase";
import { getSiteUrl } from "./site";
import { fromWatInput, startOfWatDay } from "./time";
import { maskEmail } from "./utils";
import {
	candidateSchema,
	cardLookupSchema,
	electionSchema,
	inviteSchema,
	otpSchema,
	partySchema,
	registrationSchema,
	voterLookupSchema,
	type CandidateInput,
	type ElectionInput,
	type RegistrationInput,
} from "./validation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const err = (error: string, field?: string) => ({ ok: false as const, error, field });
const GENERIC = "Something went wrong. Please try again.";
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const minutesFromNow = (m: number) => new Date(Date.now() + m * 60_000).toISOString();

function firstIssue(e: { issues: { message: string; path: (string | number)[] }[] }) {
	const issue = e.issues[0]!;
	return err(issue.message, issue.path.join("."));
}

function dataUrlToBytes(dataUrl: string) {
	const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
	return Buffer.from(base64, "base64");
}

function validFrames(frames: unknown): frames is FaceFrame[] {
	return (
		Array.isArray(frames) &&
		frames.length === 3 &&
		frames.every(
			(f) =>
				f &&
				["front", "turn", "front2"].includes(f.kind) &&
				typeof f.dataUrl === "string" &&
				f.dataUrl.startsWith("data:image/jpeg;base64,") &&
				f.dataUrl.length < 1_200_000,
		)
	);
}

/** Takes a one-time liveness challenge, returning its direction if it was valid. */
async function consumeChallenge(id: string, purpose: "register" | "vote", voterId: string | null) {
	const db = createServiceClient();
	let query = db
		.from("face_challenges")
		.update({ consumed_at: new Date().toISOString() })
		.eq("id", id)
		.eq("purpose", purpose)
		.is("consumed_at", null)
		.gt("expires_at", new Date().toISOString());
	query = voterId ? query.eq("voter_id", voterId) : query.is("voter_id", null);
	const { data } = await query.select("direction").maybeSingle();
	return (data?.direction as "left" | "right" | undefined) ?? null;
}

async function isFaceLocked(voterId: string) {
	const db = createServiceClient();
	const { data } = await db
		.from("verification_attempts")
		.select("success")
		.eq("voter_id", voterId)
		.gte("created_at", minutesAgo(LIMITS.faceLockMinutes))
		.order("created_at", { ascending: false })
		.limit(LIMITS.faceAttemptsBeforeLock);
	const recent = data ?? [];
	return recent.length >= LIMITS.faceAttemptsBeforeLock && recent.every((a) => !a.success);
}

async function hasOpenElection(district: string) {
	const db = createServiceClient();
	const now = new Date().toISOString();
	const { data } = await db
		.from("elections")
		.select("id, type, district")
		.eq("is_draft", false)
		.lte("starts_at", now)
		.gt("ends_at", now);
	return (data ?? []).some((e) => e.type === "governorship" || e.district === district);
}

// ---------------------------------------------------------------------------
// Face challenges
// ---------------------------------------------------------------------------

export async function startFaceChallenge(purpose: "register" | "vote"): Promise<ActionResult<{ id: string; direction: "left" | "right" }>> {
	let voterId: string | null = null;
	if (purpose === "vote") {
		const session = await readVoterSession();
		if (!session || session.stage !== "face") return err("Your session has expired. Please sign in again.");
		if (await isFaceLocked(session.voterId)) return err("Too many failed face checks. Try again in 30 minutes or ask an election officer for help.");
		voterId = session.voterId;
	}
	const direction = Math.random() < 0.5 ? "left" : "right";
	const db = createServiceClient();
	const { data, error } = await db
		.from("face_challenges")
		.insert({ voter_id: voterId, purpose, direction, expires_at: minutesFromNow(LIMITS.challengeTtlMinutes) })
		.select("id")
		.single();
	if (error) return err(GENERIC);
	return { ok: true, data: { id: data.id as string, direction } };
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export async function checkRegistrationAvailability(email: string, nin: string): Promise<ActionResult> {
	const db = createServiceClient();
	const [{ count: emailTaken }, { count: ninTaken }] = await Promise.all([
		db.from("voters").select("id", { count: "exact", head: true }).eq("email", email.trim().toLowerCase()),
		db.from("voters").select("id", { count: "exact", head: true }).eq("nin_hash", hashNin(nin.trim())),
	]);
	if (ninTaken) return err("This NIN is already registered.", "nin");
	if (emailTaken) return err("This email is already registered.", "email");
	return { ok: true };
}

export async function registerVoter(
	input: RegistrationInput,
	challengeId: string,
	frames: FaceFrame[],
): Promise<ActionResult<{ vin: string; email: string }>> {
	const parsed = registrationSchema.safeParse(input);
	if (!parsed.success) return firstIssue(parsed.error);
	if (!validFrames(frames)) return err("The face scan is missing. Please scan your face again.", "face");
	const v = parsed.data;

	const available = await checkRegistrationAvailability(v.email, v.nin);
	if (!available.ok) return available;

	const direction = await consumeChallenge(challengeId, "register", null);
	if (!direction) return err("The face scan expired. Please scan your face again.", "face");

	let face;
	try {
		face = await checkLiveness(frames, direction);
	} catch (e) {
		console.error("[register] face service", e);
		return err("Face verification is unavailable right now. Please try again shortly.", "face");
	}
	if (!face.ok) return err(face.message, "face");

	const db = createServiceClient();
	if (!faceMockEnabled()) {
		const { data: matches } = await db.rpc("match_face", {
			p_embedding: toPgVector(face.embedding),
			p_min_similarity: FACE.duplicateThreshold,
			p_limit: 1,
		});
		if (matches?.length) {
			return err("This face is already registered to another voter. Visit an election office if you think this is a mistake.", "face");
		}
	}

	const photoPath = `${randomUUID()}.jpg`;
	const front = frames.find((f) => f.kind === "front")!;
	const upload = await db.storage
		.from(STORAGE.voterPhotos)
		.upload(photoPath, dataUrlToBytes(front.dataUrl), { contentType: "image/jpeg" });
	if (upload.error) return err(GENERIC);

	const record = {
		first_name: v.first_name,
		middle_name: v.middle_name ?? "",
		last_name: v.last_name,
		date_of_birth: v.date_of_birth,
		gender: v.gender,
		email: v.email,
		phone: `+234${v.phone}`,
		nin_hash: hashNin(v.nin),
		nin_last4: v.nin.slice(-4),
		occupation: v.occupation,
		origin_state: v.origin_state,
		origin_lga: v.origin_lga,
		home_address: v.home_address,
		home_state: v.home_state,
		home_lga: v.home_lga,
		district: LGA_DISTRICT[v.home_lga],
		photo_path: photoPath,
	};

	for (let attempt = 0; attempt < 3; attempt++) {
		const vin = generateVin();
		const { error } = await db.rpc("register_voter", {
			p_voter: { ...record, vin },
			p_embedding: toPgVector(face.embedding),
			p_model: face.model,
			p_quality: face.quality,
		});
		if (!error) {
			sendVinEmail(v.email, v.first_name, vin).catch((e) => console.error("[register] VIN email", e));
			return { ok: true, data: { vin, email: maskEmail(v.email) } };
		}
		if (error.code !== "23505" || !error.message.includes("vin")) {
			await db.storage.from(STORAGE.voterPhotos).remove([photoPath]);
			if (error.code === "23505") return err("These details are already registered.");
			console.error("[register] insert", error);
			return err(GENERIC);
		}
	}
	await db.storage.from(STORAGE.voterPhotos).remove([photoPath]);
	return err(GENERIC);
}

// ---------------------------------------------------------------------------
// Voter sign-in
// ---------------------------------------------------------------------------

/** Development only: show the sign-in code on screen when the email could not be delivered. */
const showDevCodes = () => process.env.NODE_ENV !== "production" && process.env.DEV_SHOW_EMAIL_CODES === "true";

type OtpSent = { notice?: string; devCode?: string };

async function issueOtp(voterId: string, email: string): Promise<ActionResult<OtpSent>> {
	const db = createServiceClient();
	const { count } = await db
		.from("otp_codes")
		.select("id", { count: "exact", head: true })
		.eq("voter_id", voterId)
		.gte("created_at", minutesAgo(15));
	if ((count ?? 0) >= LIMITS.otpSendsPer15Min) return err("Too many codes requested. Wait 15 minutes and try again.");

	const code = generateOtp();
	const { error } = await db
		.from("otp_codes")
		.insert({ voter_id: voterId, code_hash: hashOtp(voterId, code), expires_at: minutesFromNow(LIMITS.otpTtlMinutes) });
	if (error) return err(GENERIC);
	let sent;
	try {
		sent = await sendOtpEmail(email, code);
	} catch (e) {
		console.error("[otp] email", e);
		return err("We could not send the email. Please try again.");
	}
	if (!sent.delivered) return { ok: true, data: { notice: sent.reason, devCode: showDevCodes() ? code : undefined } };
	return { ok: true, data: {} };
}

export async function beginVoterSignIn(input: { vin: string; nin: string; date_of_birth: string }): Promise<ActionResult<{ email: string } & OtpSent>> {
	const parsed = voterLookupSchema.safeParse(input);
	if (!parsed.success) return firstIssue(parsed.error);
	const { vin, nin, date_of_birth } = parsed.data;

	const db = createServiceClient();
	const { data: voter } = await db
		.from("voters")
		.select("id, email, nin_hash, date_of_birth, status, district")
		.eq("vin", vin)
		.maybeSingle();

	// Same message whichever detail is wrong, so details cannot be guessed one at a time.
	if (!voter || !safeEqual(voter.nin_hash, hashNin(nin)) || voter.date_of_birth !== date_of_birth) {
		return err("Those details do not match a registered voter.");
	}
	if (voter.status !== "active") return err("This voter record is suspended. Please contact an election officer.");
	if (!(await hasOpenElection(voter.district))) return err("There is no election open for you right now. Check back when voting starts.");
	if (await isFaceLocked(voter.id)) return err("Too many failed face checks. Try again in 30 minutes or ask an election officer for help.");

	const sent = await issueOtp(voter.id, voter.email);
	if (!sent.ok) return sent;
	await setVoterSession({ voterId: voter.id, stage: "pending" });
	return { ok: true, data: { email: maskEmail(voter.email), ...sent.data } };
}

export async function resendVoterOtp(): Promise<ActionResult<OtpSent>> {
	const session = await readVoterSession();
	if (!session || session.stage !== "pending") return err("Your session has expired. Please start again.");
	const db = createServiceClient();
	const { data: voter } = await db.from("voters").select("email").eq("id", session.voterId).single();
	return issueOtp(session.voterId, voter!.email);
}

export async function verifyVoterOtp(code: string): Promise<ActionResult> {
	const parsed = otpSchema.safeParse({ code });
	if (!parsed.success) return firstIssue(parsed.error);
	const session = await readVoterSession();
	if (!session || session.stage !== "pending") return err("Your session has expired. Please start again.");

	const db = createServiceClient();
	const { data: otp } = await db
		.from("otp_codes")
		.select("id, code_hash, attempts, expires_at")
		.eq("voter_id", session.voterId)
		.is("consumed_at", null)
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (!otp || new Date(otp.expires_at) < new Date()) return err("That code has expired. Request a new one.", "code");
	if (otp.attempts >= LIMITS.otpMaxAttempts) return err("Too many wrong codes. Request a new one.", "code");

	if (!safeEqual(otp.code_hash, hashOtp(session.voterId, parsed.data.code))) {
		await db.from("otp_codes").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
		return err("That code is not right. Check the email and try again.", "code");
	}

	await db.from("otp_codes").update({ consumed_at: new Date().toISOString() }).eq("id", otp.id);
	await setVoterSession({ voterId: session.voterId, stage: "face" });
	return { ok: true };
}

export async function verifyVoterFace(challengeId: string, frames: FaceFrame[]): Promise<ActionResult<{ firstName: string }>> {
	const session = await readVoterSession();
	if (!session || session.stage !== "face") return err("Your session has expired. Please sign in again.");
	if (!validFrames(frames)) return err("The face check did not finish. Please try again.");
	if (await isFaceLocked(session.voterId)) return err("Too many failed face checks. Try again in 30 minutes or ask an election officer for help.");

	const direction = await consumeChallenge(challengeId, "vote", session.voterId);
	if (!direction) return err("The face check expired. Please try again.");

	const db = createServiceClient();
	const record = async (success: boolean, reason: string, similarity?: number) => {
		await db.from("verification_attempts").insert({ voter_id: session.voterId, success, reason, similarity });
	};

	let face;
	try {
		face = await checkLiveness(frames, direction);
	} catch (e) {
		console.error("[verify] face service", e);
		return err("Face verification is unavailable right now. Please try again shortly.");
	}
	if (!face.ok) {
		await record(false, face.reason);
		return err(face.message);
	}

	let similarity = 1;
	if (!faceMockEnabled()) {
		const { data, error } = await db.rpc("face_similarity", { p_voter: session.voterId, p_embedding: toPgVector(face.embedding) });
		if (error || data === null) return err(GENERIC);
		similarity = Number(data);
	}

	if (similarity < FACE.matchThreshold) {
		await record(false, "no_match", similarity);
		const locked = await isFaceLocked(session.voterId);
		return err(
			locked
				? "We could not match your face. Sign-in is paused for 30 minutes; an election officer can help."
				: "We could not match your face to your registration. Try again in even light, facing the camera.",
		);
	}

	await record(true, "match", similarity);
	await setVoterSession({ voterId: session.voterId, stage: "ballot" });
	const { data: voter } = await db.from("voters").select("first_name").eq("id", session.voterId).single();
	return { ok: true, data: { firstName: voter!.first_name } };
}

export async function castVote(electionId: number, candidateId: number): Promise<ActionResult<{ receipt: string }>> {
	const session = await readVoterSession();
	if (!session || session.stage !== "ballot") return err("Your voting session has ended. Please sign in again.");
	const db = createServiceClient();
	const { data, error } = await db.rpc("cast_vote", { p_election: electionId, p_voter: session.voterId, p_candidate: candidateId });
	if (error) {
		const messages: Record<string, string> = {
			ALREADY_VOTED: "You have already voted in this election.",
			ELECTION_CLOSED: "This election is not open.",
			VOTER_INELIGIBLE: "You are not eligible to vote in this election.",
			INVALID_CANDIDATE: "That candidate is not on this ballot.",
		};
		const key = Object.keys(messages).find((k) => error.message.includes(k));
		if (!key) console.error("[vote]", error);
		return err(key ? messages[key]! : GENERIC);
	}
	revalidatePath("/results");
	return { ok: true, data: { receipt: data as string } };
}

export async function signOutVoter() {
	clearVoterSession();
	redirect("/results");
}

// ---------------------------------------------------------------------------
// Public lookups
// ---------------------------------------------------------------------------

export async function lookupVoterCard(input: { vin: string; date_of_birth: string }): Promise<ActionResult<VoterCard>> {
	const parsed = cardLookupSchema.safeParse(input);
	if (!parsed.success) return firstIssue(parsed.error);
	const db = createServiceClient();
	const { data } = await db
		.from("voters")
		.select("vin, first_name, middle_name, last_name, date_of_birth, gender, home_lga, district, created_at, photo_path")
		.eq("vin", parsed.data.vin)
		.eq("date_of_birth", parsed.data.date_of_birth)
		.eq("status", "active")
		.maybeSingle();
	if (!data) return err("We could not find a card with those details.");
	const [{ data: signed }, token] = await Promise.all([db.storage.from(STORAGE.voterPhotos).createSignedUrl(data.photo_path, 600), signCardToken(data.vin)]);
	const { photo_path: _photo, ...card } = data;
	return { ok: true, data: { ...card, photo_url: signed?.signedUrl ?? null, verify_url: `${siteUrl()}/verify/${token}` } as VoterCard };
}

export async function checkReceipt(code: string): Promise<ActionResult<{ election: string }>> {
	const clean = code.trim().toUpperCase();
	if (!/^AV-[0-9A-F]{5}-[0-9A-F]{5}$/.test(clean)) return err("Receipt codes look like AV-1A2B3-C4D5E.");
	const db = createSessionClient();
	const { data } = await db.rpc("check_receipt", { p_code: clean });
	if (!data) return err("No ballot with that receipt code was found.");
	return { ok: true, data: { election: (data as { election: string }).election } };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

type Need = "view" | "manage" | "super";
const ALLOWED: Record<Need, AdminRole[]> = {
	view: ["super_admin", "officer", "observer"],
	manage: ["super_admin", "officer"],
	super: ["super_admin"],
};

async function requireAdmin(need: Need) {
	const admin = await getCurrentAdmin();
	if (!admin) redirect("/admin/login");
	if (!ALLOWED[need].includes(admin.role)) throw new Error("FORBIDDEN");
	return { admin, db: createSessionClient() };
}

async function audit(admin: { id: string; email: string }, action: string, entity: string, entityId: string | number | null, details: Record<string, unknown> = {}) {
	await createServiceClient()
		.from("audit_log")
		.insert({ actor_id: admin.id, actor_email: admin.email, action, entity, entity_id: entityId === null ? null : String(entityId), details });
}

async function guarded<T>(need: Need, run: (ctx: Awaited<ReturnType<typeof requireAdmin>>) => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
	try {
		return await run(await requireAdmin(need));
	} catch (e) {
		if (e instanceof Error && e.message === "FORBIDDEN") return err("Your role cannot do this.");
		if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
		if (typeof e === "object" && e && "digest" in e) throw e; // let redirect() through
		console.error("[admin]", e);
		return err(GENERIC);
	}
}

const uniqueMessage = (code: string | undefined, message: string) => (code === "23505" ? message : GENERIC);

async function uploadImage(db: ReturnType<typeof createSessionClient>, bucket: string, file: File | null) {
	if (!file || file.size === 0) return { path: null as string | null };
	if (file.size > 2 * 1024 * 1024) return { error: "Images must be 2 MB or smaller." };
	if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type)) return { error: "Use a PNG, JPG, WebP or SVG image." };
	const ext = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1];
	const path = `${randomUUID()}.${ext}`;
	const { error } = await db.storage.from(bucket).upload(path, file, { contentType: file.type });
	if (error) return { error: "The image could not be uploaded." };
	return { path };
}

// Parties ----------------------------------------------------------------

export async function saveParty(formData: FormData): Promise<ActionResult> {
	return guarded("manage", async ({ admin, db }) => {
		const id = formData.get("id") ? Number(formData.get("id")) : null;
		const parsed = partySchema.safeParse({ name: formData.get("name"), acronym: formData.get("acronym"), color: formData.get("color") });
		if (!parsed.success) return firstIssue(parsed.error);
		const logo = await uploadImage(db, STORAGE.partyLogos, formData.get("logo") as File | null);
		if ("error" in logo) return err(logo.error!, "logo");
		const row = { ...parsed.data, ...(logo.path ? { logo_path: logo.path } : {}) };
		const { data, error } = id
			? await db.from("parties").update(row).eq("id", id).select("id").single()
			: await db.from("parties").insert(row).select("id").single();
		if (error) return err(uniqueMessage(error.code, "A party with that name or acronym already exists."));
		await audit(admin, id ? "party.updated" : "party.created", "party", data.id, { acronym: row.acronym });
		revalidatePath("/admin/parties");
		return { ok: true };
	});
}

export async function deleteParty(id: number): Promise<ActionResult> {
	return guarded("manage", async ({ admin, db }) => {
		const { error } = await db.from("parties").delete().eq("id", id);
		if (error) return err(error.code === "23503" ? "This party still has candidates. Remove them first." : GENERIC);
		await audit(admin, "party.deleted", "party", id);
		revalidatePath("/admin/parties");
		return { ok: true };
	});
}

// Candidates -------------------------------------------------------------

export async function saveCandidate(formData: FormData): Promise<ActionResult> {
	return guarded("manage", async ({ admin, db }) => {
		const id = formData.get("id") ? Number(formData.get("id")) : null;
		const input: CandidateInput = {
			full_name: String(formData.get("full_name") ?? ""),
			party_id: Number(formData.get("party_id")),
			type: formData.get("type") as CandidateInput["type"],
			district: (formData.get("district") || null) as CandidateInput["district"],
			running_mate: String(formData.get("running_mate") ?? ""),
		};
		const parsed = candidateSchema.safeParse(input);
		if (!parsed.success) return firstIssue(parsed.error);
		const photo = await uploadImage(db, STORAGE.candidatePhotos, formData.get("photo") as File | null);
		if ("error" in photo) return err(photo.error!, "photo");
		const row = { ...parsed.data, running_mate: parsed.data.running_mate || null, ...(photo.path ? { photo_path: photo.path } : {}) };
		const { data, error } = id
			? await db.from("candidates").update(row).eq("id", id).select("id").single()
			: await db.from("candidates").insert(row).select("id").single();
		if (error) return err(uniqueMessage(error.code, "That party already has a candidate for this office."), "party_id");
		await audit(admin, id ? "candidate.updated" : "candidate.created", "candidate", data.id, { name: row.full_name });
		revalidatePath("/admin/candidates");
		return { ok: true };
	});
}

export async function deleteCandidate(id: number): Promise<ActionResult> {
	return guarded("manage", async ({ admin, db }) => {
		const { error } = await db.from("candidates").delete().eq("id", id);
		if (error) return err(error.code === "23503" ? "This candidate is on an election ballot and cannot be removed." : GENERIC);
		await audit(admin, "candidate.deleted", "candidate", id);
		revalidatePath("/admin/candidates");
		return { ok: true };
	});
}

// Elections --------------------------------------------------------------

export async function createElection(input: ElectionInput): Promise<ActionResult> {
	return guarded("manage", async ({ admin, db }) => {
		const parsed = electionSchema.safeParse(input);
		if (!parsed.success) return firstIssue(parsed.error);
		const { candidate_ids, start_now, starts_at, ends_at, ...e } = parsed.data;

		// The server clock decides, never the admin's device.
		const now = Date.now();
		const start = start_now ? new Date(now) : fromWatInput(starts_at!);
		const end = fromWatInput(ends_at);
		if (!start_now && start.getTime() < startOfWatDay(now).getTime()) return err("Pick today or a later date.", "starts_at");
		if (!start_now && start.getTime() < now - 60_000) return err("That time has already passed. Pick a later time, or open voting now.", "starts_at");
		if (end.getTime() <= start.getTime()) return err("Closing time must be after opening time.", "ends_at");
		if (end.getTime() - start.getTime() < 60 * 60_000) return err("Voting must stay open for at least an hour.", "ends_at");

		const { data: picked } = await db.from("candidates").select("id, type, district").in("id", candidate_ids);
		if (!picked || picked.length !== candidate_ids.length || picked.some((c) => c.type !== e.type || c.district !== e.district)) {
			return err("Every candidate must stand for this office.", "candidate_ids");
		}

		const { data, error } = await db
			.from("elections")
			.insert({ ...e, description: e.description || null, starts_at: start.toISOString(), ends_at: end.toISOString(), created_by: admin.id })
			.select("id")
			.single();
		if (error) {
			if (error.code === "23P01") return err("Another election for this office overlaps these dates.", "starts_at");
			console.error("[election]", error);
			return err(GENERIC);
		}
		const { error: listError } = await db.from("election_candidates").insert(candidate_ids.map((candidate_id) => ({ election_id: data.id, candidate_id })));
		if (listError) {
			await db.from("elections").delete().eq("id", data.id);
			return err(GENERIC);
		}
		await audit(admin, e.is_draft ? "election.drafted" : "election.scheduled", "election", data.id, { title: e.title });
		revalidatePath("/admin/elections");
		return { ok: true };
	});
}

export async function publishElection(id: number): Promise<ActionResult> {
	return guarded("manage", async ({ admin, db }) => {
		const { data: draft } = await db.from("elections").select("starts_at").eq("id", id).eq("is_draft", true).maybeSingle();
		if (!draft) return err("This draft no longer exists.");
		if (new Date(draft.starts_at).getTime() < Date.now() - 60_000) return err("This draft's opening time has passed. Delete it and schedule the election again.");
		const { error } = await db.from("elections").update({ is_draft: false }).eq("id", id).eq("is_draft", true);
		if (error) return err(error.code === "23P01" ? "Another election for this office overlaps these dates." : GENERIC);
		await audit(admin, "election.published", "election", id);
		revalidatePath("/admin/elections");
		return { ok: true };
	});
}

export async function endElectionEarly(id: number): Promise<ActionResult> {
	return guarded("manage", async ({ admin, db }) => {
		const now = new Date().toISOString();
		const { data, error } = await db
			.from("elections")
			.update({ ends_at: now, ended_early_at: now })
			.eq("id", id)
			.lte("starts_at", now)
			.gt("ends_at", now)
			.select("title")
			.maybeSingle();
		if (error || !data) return err("This election is not live.");
		await audit(admin, "election.ended_early", "election", id, { title: data.title });
		revalidatePath("/admin/elections");
		revalidatePath("/results");
		return { ok: true };
	});
}

export async function deleteElection(id: number): Promise<ActionResult> {
	return guarded("manage", async ({ admin, db }) => {
		const { data: e } = await db.from("elections").select("is_draft, starts_at, title").eq("id", id).single();
		if (!e || (!e.is_draft && new Date(e.starts_at) <= new Date())) return err("Only drafts and scheduled elections can be deleted.");
		const { error } = await db.from("elections").delete().eq("id", id);
		if (error) return err(GENERIC);
		await audit(admin, "election.deleted", "election", id, { title: e.title });
		revalidatePath("/admin/elections");
		return { ok: true };
	});
}

// Voters -----------------------------------------------------------------

export async function getVoterDetail(id: string): Promise<ActionResult<{ photoUrl: string | null; participation: { election_id: number; title: string; voted: boolean }[] }>> {
	return guarded("view", async ({ db }) => {
		const { data: voter } = await db.from("voters").select("photo_path").eq("id", id).single();
		if (!voter) return err("Voter not found.");
		const [{ data: signed }, { data: participation }] = await Promise.all([
			createServiceClient().storage.from(STORAGE.voterPhotos).createSignedUrl(voter.photo_path, 300),
			db.rpc("voter_participation", { p_voter: id }),
		]);
		return { ok: true, data: { photoUrl: signed?.signedUrl ?? null, participation: participation ?? [] } };
	});
}

export async function setVoterStatus(id: string, status: "active" | "suspended"): Promise<ActionResult> {
	return guarded("manage", async ({ admin, db }) => {
		const { error } = await db.from("voters").update({ status }).eq("id", id);
		if (error) return err(GENERIC);
		await audit(admin, status === "suspended" ? "voter.suspended" : "voter.reinstated", "voter", id);
		revalidatePath("/admin/voters");
		return { ok: true };
	});
}

export async function resendVin(id: string): Promise<ActionResult> {
	return guarded("manage", async ({ admin, db }) => {
		const { data: v } = await db.from("voters").select("email, first_name, vin").eq("id", id).single();
		if (!v) return err("Voter not found.");
		await sendVinEmail(v.email, v.first_name, v.vin);
		await audit(admin, "voter.vin_resent", "voter", id);
		return { ok: true };
	});
}

// Team -------------------------------------------------------------------

const siteUrl = getSiteUrl;

/** One-time link to the set-password page, built from a Supabase hashed token. */
async function adminLink(type: "invite" | "recovery", email: string) {
	const { data, error } = await createServiceClient().auth.admin.generateLink({ type, email });
	if (error || !data.properties?.hashed_token) return { error: error?.message ?? "no token" };
	const url = `${siteUrl()}/admin/set-password?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=${type}`;
	return { url, userId: data.user?.id };
}

export async function inviteAdmin(input: { full_name: string; email: string; role: AdminRole }): Promise<ActionResult> {
	return guarded("super", async ({ admin }) => {
		const parsed = inviteSchema.safeParse(input);
		if (!parsed.success) return firstIssue(parsed.error);
		const service = createServiceClient();
		const link = await adminLink("invite", parsed.data.email);
		if ("error" in link || !link.userId) return err(link.error?.includes("already") ? "That email already has an account." : GENERIC);
		const { error: insertError } = await service.from("admins").insert({ id: link.userId, ...parsed.data });
		if (insertError) return err(uniqueMessage(insertError.code, "That person is already on the team."));
		await sendAdminLinkEmail(parsed.data.email, "invite", link.url!);
		await audit(admin, "admin.invited", "admin", link.userId, { email: parsed.data.email, role: parsed.data.role });
		revalidatePath("/admin/team");
		return { ok: true };
	});
}

/** Always answers the same way, so it cannot be used to find out who is an admin. */
export async function requestAdminPasswordReset(email: string): Promise<ActionResult> {
	const clean = email.trim().toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return err("Enter a valid email", "email");
	const { data: admin } = await createServiceClient().from("admins").select("id").eq("email", clean).maybeSingle();
	if (admin) {
		const link = await adminLink("recovery", clean);
		if ("url" in link && link.url) await sendAdminLinkEmail(clean, "reset", link.url).catch((e) => console.error("[reset] email", e));
	}
	return { ok: true };
}

export async function updateAdminRole(id: string, role: AdminRole): Promise<ActionResult> {
	return guarded("super", async ({ admin, db }) => {
		if (id === admin.id) return err("You cannot change your own role.");
		const { error } = await db.from("admins").update({ role }).eq("id", id);
		if (error) return err(GENERIC);
		await audit(admin, "admin.role_changed", "admin", id, { role });
		revalidatePath("/admin/team");
		return { ok: true };
	});
}

export async function removeAdmin(id: string): Promise<ActionResult> {
	return guarded("super", async ({ admin }) => {
		if (id === admin.id) return err("You cannot remove yourself.");
		const { error } = await createServiceClient().auth.admin.deleteUser(id);
		if (error) return err(GENERIC);
		await audit(admin, "admin.removed", "admin", id);
		revalidatePath("/admin/team");
		return { ok: true };
	});
}

export async function signOutAdmin() {
	await createSessionClient().auth.signOut();
	redirect("/admin/login");
}
