"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FaceCapture } from "@/components/face/FaceCapture";
import { AnimatedCheck, OtpInput } from "@/components/ui/Bits";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { beginVoterSignIn, resendVoterOtp, startFaceChallenge, verifyVoterFace, verifyVoterOtp } from "@/lib/supabase-actions";
import { cn } from "@/lib/utils";
import { voterLookupSchema } from "@/lib/validation";
import type { FaceFrame } from "@/types";
import type { z } from "zod";

type Step = 0 | 1 | 2 | 3;
const LABELS = ["Your details", "Email code", "Face check"];
const slide = { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -24 }, transition: { duration: 0.3 } };

export function SignInFlow({ initialStep = 0 }: { initialStep?: Step }) {
	const [step, setStep] = useState<Step>(initialStep);
	const [email, setEmail] = useState("your email");
	const [code, setCode] = useState("");
	const [codeError, setCodeError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [cooldown, setCooldown] = useState(0);
	const [challenge, setChallenge] = useState<{ id: string; direction: "left" | "right" } | null>(null);
	const [resetKey, setResetKey] = useState(0);
	const [faceError, setFaceError] = useState<string | null>(null);
	const [firstName, setFirstName] = useState("");

	const form = useForm<z.input<typeof voterLookupSchema>>({ resolver: zodResolver(voterLookupSchema), mode: "onTouched" });
	const { register, handleSubmit, formState } = form;

	useEffect(() => {
		if (cooldown <= 0) return;
		const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
		return () => clearTimeout(id);
	}, [cooldown]);

	const newChallenge = useCallback(async () => {
		setChallenge(null);
		const res = await startFaceChallenge("vote");
		if (!res.ok) return setFaceError(res.error);
		setChallenge(res.data);
		setResetKey((k) => k + 1);
	}, []);

	useEffect(() => {
		if (step === 2 && !challenge) newChallenge();
	}, [step, challenge, newChallenge]);

	const onDetails = handleSubmit(async (values) => {
		setBusy(true);
		const res = await beginVoterSignIn(values);
		setBusy(false);
		if (!res.ok) return toast.error(res.error);
		setEmail(res.data.email);
		setCooldown(45);
		setStep(1);
	});

	const onCode = async () => {
		setBusy(true);
		const res = await verifyVoterOtp(code);
		setBusy(false);
		if (!res.ok) {
			setCodeError(res.error);
			if (res.error.includes("expired. Please start")) setStep(0);
			return;
		}
		setCodeError(null);
		setStep(2);
	};

	const resend = async () => {
		const res = await resendVoterOtp();
		if (!res.ok) return toast.error(res.error);
		setCooldown(45);
		toast.success("A new code is on its way.");
	};

	const onFrames = async (frames: FaceFrame[]) => {
		if (!challenge) return;
		setBusy(true);
		const res = await verifyVoterFace(challenge.id, frames);
		setBusy(false);
		if (res.ok) {
			setFirstName(res.data.firstName);
			setStep(3);
			return;
		}
		setFaceError(res.error);
		if (res.error.includes("session has expired")) setStep(0);
	};

	return (
		<div className="container-page flex flex-wrap items-stretch gap-7 py-12 pb-20">
			<aside className="guilloche hidden flex-[1_1_340px] flex-col gap-7 rounded-[28px] bg-forest p-10 text-white md:flex">
				<h1 className="h-display text-[38px] font-extrabold leading-[1.05]">Sign in to vote</h1>
				<p className="leading-relaxed text-[#C9E7D3]">Three quick checks keep your vote yours. You can only sign in while an election is open.</p>
				<ol className="flex flex-col gap-3.5">
					{LABELS.map((label, i) => (
						<li key={label} className="flex items-center gap-3.5">
							<span className={cn("inline-flex h-[34px] w-[34px] items-center justify-center rounded-full text-sm font-bold transition-all", i < step ? "bg-[#4ADE80] text-forest" : i === step ? "bg-white text-forest" : "bg-white/10 text-[#C9E7D3]")}>
								{i < step ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
							</span>
							<span className={cn("font-semibold", i <= step ? "text-white" : "text-[#9CC7AE]")}>{label}</span>
						</li>
					))}
				</ol>
				<p className="mt-auto flex gap-3 rounded-2xl bg-white/[0.07] p-4 text-sm leading-relaxed text-[#C9E7D3]">
					<ShieldCheck className="draw-in h-[22px] w-[22px] shrink-0 text-[#86EFAC]" aria-hidden />
					Your camera frames are checked on our server and are not stored after sign-in.
				</p>
			</aside>

			<section className="flex min-w-0 flex-[999_1_520px] flex-col gap-6 rounded-[28px] border border-line bg-white p-[clamp(20px,4vw,44px)] shadow-card">
				<div className="grid grid-cols-3 gap-2" aria-hidden>
					{LABELS.map((l, i) => (
						<div key={l} className={cn("h-1.5 rounded-md transition-colors duration-500", i < step ? "bg-brand" : i === step ? "bg-brand-300" : "bg-line")} />
					))}
				</div>
				<h1 className="sr-only md:hidden">Sign in to vote</h1>

				<AnimatePresence mode="wait">
					{step === 0 && (
						<motion.form key="d" {...slide} onSubmit={onDetails} noValidate className="flex flex-col gap-5">
							<header>
								<h2 className="h-display text-[28px]">Confirm who you are</h2>
								<p className="mt-1.5 text-muted">Use the details from your registration.</p>
							</header>
							<Field label="Voter ID Number (VIN)" error={formState.errors.vin?.message}>
								{(p) => <Input {...p} autoComplete="off" placeholder="XXXX-XXXX-XXXX" className="font-mono uppercase tracking-[0.08em]" {...register("vin")} />}
							</Field>
							<Field label="NIN" error={formState.errors.nin?.message}>
								{(p) => <Input {...p} inputMode="numeric" maxLength={11} autoComplete="off" className="font-mono tracking-[0.1em]" {...register("nin")} />}
							</Field>
							<Field label="Date of birth" error={formState.errors.date_of_birth?.message}>
								{(p) => <Input {...p} type="date" {...register("date_of_birth")} />}
							</Field>
							<Button type="submit" size="lg" loading={busy} lift>
								Send my code
							</Button>
							<p className="text-center text-sm text-subtle">
								Not registered yet? <Link href="/register" className="font-semibold text-brand hover:underline">Register to vote</Link>
							</p>
						</motion.form>
					)}

					{step === 1 && (
						<motion.form key="o" {...slide} onSubmit={(e) => (e.preventDefault(), onCode())} className="flex flex-col gap-5">
							<span className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-brand-50 text-brand">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden>
									<rect x="3" y="5" width="18" height="14" rx="2" />
									<path d="M3 7l9 6 9-6" className="origin-top [animation:flap_2.6s_ease-in-out_infinite] [transform-box:fill-box]" />
								</svg>
							</span>
							<header>
								<h2 className="h-display text-[28px]">Check your email</h2>
								<p className="mt-1.5 text-muted">
									We sent a 6-digit code to <b>{email}</b>. It expires in 10 minutes.
								</p>
							</header>
							<OtpInput value={code} onChange={(v) => (setCode(v), setCodeError(null))} invalid={Boolean(codeError)} disabled={busy} />
							{codeError && <p role="alert" className="text-sm font-medium text-danger">{codeError}</p>}
							<Button type="submit" size="lg" loading={busy} disabled={code.length !== 6} lift>
								Verify code
							</Button>
							<div className="flex items-center justify-between text-sm text-subtle">
								<button type="button" onClick={() => setStep(0)} className="min-h-11 font-semibold text-brand">
									Change details
								</button>
								{cooldown > 0 ? (
									<span>Resend in 0:{String(cooldown).padStart(2, "0")}</span>
								) : (
									<button type="button" onClick={resend} className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand">
										<Mail className="h-4 w-4" aria-hidden /> Resend code
									</button>
								)}
							</div>
						</motion.form>
					)}

					{step === 2 && (
						<motion.div key="f" {...slide} className="flex flex-col gap-5">
							<header>
								<h2 className="h-display text-[28px]">Live face check</h2>
								<p className="mt-1.5 text-muted">Follow the prompts. We compare you with the face you enrolled. Remove glasses or a face covering.</p>
							</header>
							{faceError && (
								<p role="alert" className="flex animate-shake gap-2.5 rounded-xl bg-danger-bg px-4 py-3 text-sm font-medium text-danger">
									<AlertTriangle className="h-5 w-5 shrink-0" aria-hidden /> {faceError}
								</p>
							)}
							<FaceCapture
								direction={challenge?.direction ?? null}
								resetKey={resetKey}
								busy={busy}
								onComplete={onFrames}
								onRetry={() => {
									setFaceError(null);
									newChallenge();
								}}
							/>
						</motion.div>
					)}

					{step === 3 && (
						<motion.div key="w" {...slide} className="flex flex-col items-center gap-4 py-7 text-center">
							<AnimatedCheck size={96} />
							<h2 className="h-display mt-2 text-[34px] font-extrabold">{firstName ? `Welcome, ${firstName}` : "Identity confirmed"}</h2>
							<p className="max-w-[420px] leading-relaxed text-muted">Identity confirmed. Your voting session lasts 15 minutes.</p>
							<ButtonLink href="/vote/ballot" size="lg" className="mt-2" lift>
								Go to my ballot <ArrowRight className="h-5 w-5" aria-hidden />
							</ButtonLink>
						</motion.div>
					)}
				</AnimatePresence>
			</section>
		</div>
	);
}
