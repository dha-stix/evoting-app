import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "crypto";

const pepper = () => {
	const p = process.env.NIN_PEPPER;
	if (!p || p.length < 16) throw new Error("NIN_PEPPER must be at least 16 characters");
	return p;
};

/** Keyed hash so NINs can be matched without being stored. */
export const hashNin = (nin: string) => createHmac("sha256", pepper()).update(`nin:${nin}`).digest("hex");

export const hashOtp = (voterId: string, code: string) =>
	createHmac("sha256", pepper()).update(`otp:${voterId}:${code}`).digest("hex");

export function safeEqual(a: string, b: string) {
	const ab = Buffer.from(a);
	const bb = Buffer.from(b);
	return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export const generateOtp = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

// No 0/O or 1/I so VINs can be read aloud and typed without mistakes.
const VIN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateVin() {
	const chars = Array.from({ length: 12 }, () => VIN_ALPHABET[randomInt(0, VIN_ALPHABET.length)]);
	return `${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8).join("")}`;
}
