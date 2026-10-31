import "server-only";
import type { FaceFrame } from "@/types";

/**
 * Talks to the Python face service (face-service/) and turns its raw numbers
 * into pass/fail decisions. All decisions are made here on the server; the
 * browser only guides the user and sends frames.
 */

interface FrameAnalysis {
	id: FaceFrame["kind"];
	face_count: number;
	det_score: number;
	embedding: number[] | null;
	yaw: number; // nose offset from the eye midpoint, in eye-widths. + is the person's left.
	spoof_score: number | null; // probability the face is real, if the anti-spoof model is loaded
	sharpness: number;
	brightness: number;
	face_ratio: number;
}

interface ServiceResponse {
	model: string;
	antispoof: boolean;
	results: FrameAnalysis[];
}

export const FACE = {
	matchThreshold: Number(process.env.FACE_MATCH_THRESHOLD ?? 0.45),
	duplicateThreshold: Number(process.env.FACE_DUPLICATE_THRESHOLD ?? 0.6),
	requireAntispoof: process.env.FACE_REQUIRE_ANTISPOOF !== "false",
	minLiveScore: Number(process.env.FACE_MIN_LIVE_SCORE ?? 0.7),
	minTurn: 0.18,
	maxFrontYaw: 0.12,
	minSharpness: 35,
	minFaceRatio: 0.12,
};

/** Development-only shortcut so the UI can be tried without the Python service. */
export const faceMockEnabled = () => process.env.NODE_ENV !== "production" && process.env.FACE_SERVICE_MOCK === "true";

export type LivenessResult =
	| { ok: true; embedding: number[]; quality: number; model: string }
	| { ok: false; reason: string; message: string };

const fail = (reason: string, message: string): LivenessResult => ({ ok: false, reason, message });

async function analyze(frames: FaceFrame[]): Promise<ServiceResponse> {
	const url = process.env.FACE_SERVICE_URL;
	if (!url) throw new Error("FACE_SERVICE_URL is not set");
	const res = await fetch(`${url.replace(/\/$/, "")}/analyze`, {
		method: "POST",
		headers: { "content-type": "application/json", "x-api-key": process.env.FACE_SERVICE_KEY ?? "" },
		body: JSON.stringify({ images: frames.map((f) => ({ id: f.kind, data: f.dataUrl.replace(/^data:image\/\w+;base64,/, "") })) }),
		cache: "no-store",
		signal: AbortSignal.timeout(20_000),
	});
	if (!res.ok) throw new Error(`Face service responded ${res.status}`);
	return res.json();
}

const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i]!, 0);
const normalize = (v: number[]) => {
	const n = Math.sqrt(dot(v, v));
	return v.map((x) => x / n);
};

/**
 * Checks the three frames from one liveness session:
 * a front-facing frame, a frame turned in the direction the server asked for,
 * and a second front-facing frame. All three must be the same live person.
 */
export async function checkLiveness(frames: FaceFrame[], direction: "left" | "right"): Promise<LivenessResult> {
	const kinds = frames.map((f) => f.kind).sort().join();
	if (kinds !== "front,front2,turn") return fail("bad_frames", "The face check did not finish. Please try again.");

	if (faceMockEnabled()) {
		return { ok: true, embedding: Array.from({ length: 512 }, (_, i) => (i === 0 ? 1 : 0)), quality: 1, model: "mock" };
	}

	const data = await analyze(frames);
	const byKind = Object.fromEntries(data.results.map((r) => [r.id, r])) as Record<FaceFrame["kind"], FrameAnalysis>;
	const front = byKind.front;
	const turn = byKind.turn;
	const front2 = byKind.front2;
	if (!front || !turn || !front2) return fail("bad_frames", "The face check did not finish. Please try again.");

	for (const f of [front, turn, front2]) {
		if (f.face_count === 0) return fail("no_face", "We could not see your face. Keep it inside the circle.");
		if (f.face_count > 1) return fail("multiple_faces", "Only one person should be in the frame.");
		if (!f.embedding) return fail("no_face", "We could not see your face clearly.");
	}

	if (data.antispoof) {
		const lowest = Math.min(front.spoof_score ?? 0, turn.spoof_score ?? 0, front2.spoof_score ?? 0);
		if (lowest < FACE.minLiveScore) return fail("spoof", "This looks like a photo or a screen. Use your live face.");
	} else if (FACE.requireAntispoof) {
		throw new Error("Face service is running without its anti-spoof model");
	}

	for (const f of [front, front2]) {
		if (f.face_ratio < FACE.minFaceRatio) return fail("too_far", "Move closer so your face fills the circle.");
		if (f.sharpness < FACE.minSharpness) return fail("blurry", "The picture is blurry. Hold still in good light.");
		if (f.brightness < 50) return fail("dark", "It is too dark. Face a window or a light.");
		if (f.brightness > 225) return fail("bright", "There is too much light behind or on you.");
		if (Math.abs(f.yaw) > FACE.maxFrontYaw) return fail("not_front", "Look straight at the camera.");
	}

	const turned = direction === "left" ? turn.yaw >= FACE.minTurn : turn.yaw <= -FACE.minTurn;
	if (!turned) return fail("no_turn", `We did not see you turn your head to the ${direction}.`);

	const a = normalize(front.embedding!);
	const b = normalize(front2.embedding!);
	const t = normalize(turn.embedding!);
	if (dot(a, b) < 0.6 || dot(a, t) < 0.35) return fail("inconsistent", "The face changed during the check. Please try again.");

	const embedding = normalize(a.map((v, i) => v + b[i]!));
	const quality = Math.min(1, ((front.det_score + front2.det_score) / 2) * Math.min(1, Math.min(front.sharpness, front2.sharpness) / 120));
	return { ok: true, embedding, quality, model: data.model };
}

export const toPgVector = (v: number[]) => `[${v.map((x) => x.toFixed(6)).join(",")}]`;
