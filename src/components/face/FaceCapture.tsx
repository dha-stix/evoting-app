"use client";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, RefreshCw, ScanFace } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { FaceFrame } from "@/types";

/**
 * Guides the user through a liveness sequence and hands back three
 * un-mirrored JPEG frames. Everything here is only guidance: the server
 * re-checks faces, the head turn, anti-spoofing and the match.
 */

const MP_VERSION = "0.10.18";
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

type Stage = "idle" | "loading" | "align" | "blink" | "turn" | "return" | "done" | "error";

const CHECKS = [
	{ key: "align", label: "Face centred", sub: "Fill the circle, even light" },
	{ key: "blink", label: "Blink", sub: "Shows you are live" },
	{ key: "turn", label: "Turn your head", sub: "When asked" },
	{ key: "return", label: "Look back", sub: "Face the camera again" },
] as const;

const ORDER: Stage[] = ["align", "blink", "turn", "return", "done"];

interface Props {
	direction: "left" | "right" | null;
	busy?: boolean;
	onComplete: (frames: FaceFrame[]) => void;
	/** Called when the user wants a fresh attempt (parent should fetch a new challenge). */
	onRetry?: () => void;
	resetKey?: number;
}

export function FaceCapture({ direction, busy, onComplete, onRetry, resetKey = 0 }: Props) {
	const video = useRef<HTMLVideoElement>(null);
	const canvas = useRef<HTMLCanvasElement | null>(null);
	const stream = useRef<MediaStream | null>(null);
	const landmarker = useRef<FaceLandmarker | null>(null);
	const raf = useRef<number>(0);
	const frames = useRef<FaceFrame[]>([]);
	const hold = useRef<{ since: number; key: string } | null>(null);
	const blinkState = useRef<"open" | "closed">("open");
	const frameCount = useRef(0);
	const brightness = useRef(128);
	const dir = useRef(direction);
	dir.current = direction;

	const [stage, setStage] = useState<Stage>("idle");
	const [prompt, setPrompt] = useState("Allow camera access to start");
	const [error, setError] = useState<string | null>(null);
	const [progress, setProgress] = useState(0);
	const stageRef = useRef<Stage>("idle");
	const go = (s: Stage) => {
		stageRef.current = s;
		setStage(s);
		setProgress(Math.max(0, ORDER.indexOf(s)) / 4);
	};

	const stop = useCallback(() => {
		cancelAnimationFrame(raf.current);
		stream.current?.getTracks().forEach((t) => t.stop());
		stream.current = null;
	}, []);

	useEffect(() => () => stop(), [stop]);

	// A new challenge from the parent means start over.
	useEffect(() => {
		frames.current = [];
		hold.current = null;
		if (stageRef.current !== "idle" && stageRef.current !== "loading" && stageRef.current !== "error") {
			go(stream.current ? "align" : "idle");
			setPrompt("Centre your face in the circle");
			if (stream.current) loop();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [resetKey]);

	const grab = (kind: FaceFrame["kind"]) => {
		const v = video.current!;
		const c = (canvas.current ??= document.createElement("canvas"));
		const scale = Math.min(1, 640 / v.videoWidth);
		c.width = Math.round(v.videoWidth * scale);
		c.height = Math.round(v.videoHeight * scale);
		c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height); // not mirrored
		frames.current = frames.current.filter((f) => f.kind !== kind).concat({ kind, dataUrl: c.toDataURL("image/jpeg", 0.85) });
	};

	const measureBrightness = () => {
		const v = video.current!;
		const c = document.createElement("canvas");
		c.width = 32;
		c.height = 32;
		const ctx = c.getContext("2d", { willReadFrequently: true })!;
		ctx.drawImage(v, 0, 0, 32, 32);
		const d = ctx.getImageData(0, 0, 32, 32).data;
		let sum = 0;
		for (let i = 0; i < d.length; i += 4) sum += 0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!;
		brightness.current = sum / (d.length / 4);
	};

	/** True once `ok` has held for `ms`. */
	const held = (key: string, ok: boolean, ms: number) => {
		if (!ok) {
			if (hold.current?.key === key) hold.current = null;
			return false;
		}
		const now = performance.now();
		if (hold.current?.key !== key) hold.current = { key, since: now };
		return now - hold.current.since >= ms;
	};

	const loop = () => {
		const v = video.current;
		const lm = landmarker.current;
		if (!v || !lm || v.readyState < 2) {
			raf.current = requestAnimationFrame(loop);
			return;
		}
		if (frameCount.current++ % 10 === 0) measureBrightness();
		const result = lm.detectForVideo(v, performance.now());
		const faces = result.faceLandmarks;
		const stage = stageRef.current;

		if (faces.length === 0) setPrompt("Centre your face in the circle");
		else if (faces.length > 1) setPrompt("Only one person should be in view");
		else {
			const pts = faces[0]!;
			const xs = pts.map((p) => p.x);
			const ys = pts.map((p) => p.y);
			const w = Math.max(...xs) - Math.min(...xs);
			const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
			const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
			const nose = pts[1]!;
			const eyeA = pts[33]!;
			const eyeB = pts[263]!;
			const yaw = (nose.x - (eyeA.x + eyeB.x) / 2) / Math.max(Math.abs(eyeB.x - eyeA.x), 0.01); // + = person's left
			const shapes = result.faceBlendshapes?.[0]?.categories ?? [];
			const blink = Math.max(shapes.find((c) => c.categoryName === "eyeBlinkLeft")?.score ?? 0, shapes.find((c) => c.categoryName === "eyeBlinkRight")?.score ?? 0);
			const centred = Math.abs(cx - 0.5) < 0.14 && Math.abs(cy - 0.5) < 0.18;
			const sized = w > 0.24 && w < 0.75;
			const lit = brightness.current > 60 && brightness.current < 215;
			const front = Math.abs(yaw) < 0.08;

			if (stage === "align") {
				if (!sized) setPrompt(w <= 0.24 ? "Move a little closer" : "Move back a little");
				else if (!centred) setPrompt("Centre your face in the circle");
				else if (!lit) setPrompt(brightness.current <= 60 ? "Find more light" : "Too bright, move away from the light");
				else if (!front) setPrompt("Look straight at the camera");
				else setPrompt("Hold still…");
				if (held("align", sized && centred && lit && front, 700)) {
					grab("front");
					go("blink");
					setPrompt("Now blink once");
				}
			} else if (stage === "blink") {
				if (blink > 0.55) blinkState.current = "closed";
				else if (blink < 0.25 && blinkState.current === "closed") {
					blinkState.current = "open";
					go("turn");
					setPrompt(`Slowly turn your head to your ${dir.current}`);
				}
			} else if (stage === "turn" && dir.current) {
				const turned = dir.current === "left" ? yaw > 0.24 : yaw < -0.24;
				if (held("turn", turned && sized, 250)) {
					grab("turn");
					go("return");
					setPrompt("Now look back at the camera");
				}
			} else if (stage === "return") {
				if (held("return", front && centred && sized, 500)) {
					grab("front2");
					go("done");
					setPrompt("Captured");
					stop();
					onComplete(frames.current);
					return;
				}
			}
		}
		raf.current = requestAnimationFrame(loop);
	};

	const start = async () => {
		setError(null);
		go("loading");
		setPrompt("Starting camera…");
		try {
			stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
			video.current!.srcObject = stream.current;
			await video.current!.play();
			if (!landmarker.current) {
				setPrompt("Loading face guide…");
				const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
				const files = await FilesetResolver.forVisionTasks(WASM);
				landmarker.current = await FaceLandmarker.createFromOptions(files, {
					baseOptions: { modelAssetPath: MODEL, delegate: "GPU" },
					runningMode: "VIDEO",
					numFaces: 2,
					outputFaceBlendshapes: true,
				});
			}
			frames.current = [];
			go("align");
			setPrompt("Centre your face in the circle");
			loop();
		} catch (e) {
			stop();
			const name = (e as Error).name;
			setError(
				name === "NotAllowedError"
					? "Camera access was blocked. Allow the camera in your browser settings, then try again."
					: name === "NotFoundError"
						? "No camera was found on this device."
						: "We could not start the face check. Check your connection and try again.",
			);
			go("error");
		}
	};

	const active = ["align", "blink", "turn", "return"].includes(stage);
	const stageIndex = ORDER.indexOf(stage);

	return (
		<div className="flex flex-wrap items-stretch gap-6">
			<div className="relative flex aspect-[4/5] max-h-[460px] min-w-0 flex-[1_1_300px] items-center justify-center overflow-hidden rounded-3xl bg-[#0F2A1D]">
				<video ref={video} playsInline muted className={cn("absolute inset-0 h-full w-full -scale-x-100 object-cover transition-opacity", stream.current || active ? "opacity-100" : "opacity-0")} />
				{/* Oval guide with a progress ring */}
				<svg viewBox="0 0 100 125" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
					<defs>
						<mask id="oval-cut">
							<rect width="100" height="125" fill="white" />
							<ellipse cx="50" cy="58" rx="31" ry="40" fill="black" />
						</mask>
					</defs>
					<rect width="100" height="125" fill="rgba(6,30,18,.55)" mask="url(#oval-cut)" />
					<ellipse cx="50" cy="58" rx="31" ry="40" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1" strokeDasharray={stage === "done" ? "0" : "3 2"} />
					<ellipse cx="50" cy="58" rx="31" ry="40" fill="none" stroke="#4ADE80" strokeWidth="1.6" strokeLinecap="round" pathLength={100} strokeDasharray="100" strokeDashoffset={100 - progress * 100} transform="rotate(-90 50 58)" className="transition-[stroke-dashoffset] duration-500" />
				</svg>
				{!active && stage !== "done" && (
					<div className="relative flex flex-col items-center gap-3 px-6 text-center text-white">
						<ScanFace className="h-14 w-14 text-[#86EFAC]" strokeWidth={1.4} aria-hidden />
						{stage === "loading" && <span className="text-sm text-[#C9E7D3]">{prompt}</span>}
					</div>
				)}
				{active && <div className="absolute left-[19%] right-[19%] h-[3px] animate-scan rounded bg-[#4ADE80] shadow-[0_0_18px_4px_rgba(74,222,128,.55)]" aria-hidden />}
				<AnimatePresence>
					{stage === "done" && (
						<motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inline-flex h-[76px] w-[76px] items-center justify-center rounded-full bg-brand-500 text-white shadow-[0_0_0_10px_rgba(19,163,94,.25)]">
							<Check className="h-10 w-10" strokeWidth={2.6} />
						</motion.div>
					)}
				</AnimatePresence>
				{(active || stage === "done") && (
					<span className="absolute left-3.5 top-3.5 inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-xs font-semibold text-white">
						<span className="h-[7px] w-[7px] rounded-full bg-[#F87171]" /> Camera on
					</span>
				)}
				{(active || stage === "done") && (
					<span aria-live="polite" className="absolute bottom-4 left-1/2 max-w-[90%] -translate-x-1/2 truncate rounded-full bg-black/55 px-3.5 py-2 text-sm font-semibold text-white">
						{busy ? "Checking…" : prompt}
					</span>
				)}
			</div>

			<div className="flex min-w-0 flex-[1_1_240px] flex-col gap-3">
				{CHECKS.map((c, i) => {
					const done = stageIndex > i || stage === "done";
					const current = stageIndex === i;
					return (
						<div key={c.key} className={cn("flex items-center gap-3 rounded-2xl border p-3.5 transition-colors", done ? "border-[#BFE3CB] bg-[#F3FAF5]" : "border-line")}>
							<span className={cn("inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white transition-colors", done ? "bg-brand" : current ? "animate-live border-2 border-brand-500" : "border-2 border-[#CBD5CA]")}>
								{done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
							</span>
							<span className="flex flex-col">
								<b className="text-[15px]">{c.key === "turn" && direction ? `Turn your head ${direction}` : c.label}</b>
								<span className="text-[13px] text-subtle">{c.sub}</span>
							</span>
						</div>
					);
				})}
				{error && (
					<p role="alert" className="rounded-xl bg-danger-bg px-3.5 py-3 text-sm font-medium text-danger">
						{error}
					</p>
				)}
				<div className="mt-auto pt-1">
					{(stage === "idle" || stage === "error") && (
						<Button size="lg" className="w-full" onClick={start} disabled={!direction} lift>
							<Camera className="h-5 w-5" aria-hidden /> {stage === "error" ? "Try again" : "Start face scan"}
						</Button>
					)}
					{stage === "loading" && (
						<Button size="lg" className="w-full" loading>
							Starting…
						</Button>
					)}
					{stage === "done" && onRetry && !busy && (
						<Button variant="secondary" className="w-full" onClick={onRetry}>
							<RefreshCw className="h-[18px] w-[18px]" aria-hidden /> Scan again
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
