import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { LIMITS } from "./constants";

/**
 * Voters never get a Supabase account. Their progress through sign-in is
 * carried in a short-lived signed cookie:
 *   pending → identity details matched, waiting for the email code
 *   face    → email code confirmed, waiting for the face check
 *   ballot  → face matched, may vote until it expires
 */
export type VoterStage = "pending" | "face" | "ballot";
export interface VoterSession {
	voterId: string;
	stage: VoterStage;
}

const COOKIE = "av_voter";

const secret = () => {
	const s = process.env.SESSION_SECRET;
	if (!s || s.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
	return new TextEncoder().encode(s);
};

export async function setVoterSession(session: VoterSession) {
	const minutes = session.stage === "ballot" ? LIMITS.ballotSessionMinutes : LIMITS.pendingSessionMinutes;
	const token = await new SignJWT({ stage: session.stage })
		.setProtectedHeader({ alg: "HS256" })
		.setSubject(session.voterId)
		.setIssuedAt()
		.setExpirationTime(`${minutes}m`)
		.sign(secret());
	cookies().set(COOKIE, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		path: "/",
		maxAge: minutes * 60,
	});
}

export async function readVoterSession(): Promise<(VoterSession & { expiresAt: number }) | null> {
	const token = cookies().get(COOKIE)?.value;
	if (!token) return null;
	try {
		const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
		if (!payload.sub || !payload.exp) return null;
		return { voterId: payload.sub, stage: payload.stage as VoterStage, expiresAt: payload.exp * 1000 };
	} catch {
		return null;
	}
}

export function clearVoterSession() {
	cookies().delete(COOKIE);
}

/** Token printed as a QR code on the voter card, so officials can confirm it is genuine. */
export async function signCardToken(vin: string) {
	return new SignJWT({ typ: "card" }).setProtectedHeader({ alg: "HS256" }).setSubject(vin).setIssuedAt().sign(secret());
}

export async function verifyCardToken(token: string) {
	try {
		const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
		return payload.typ === "card" && payload.sub ? payload.sub : null;
	} catch {
		return null;
	}
}
