"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, IdCard, Lock, MapPin, Pencil } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import { FaceCapture } from "@/components/face/FaceCapture";
import { AnimatedCheck, CopyButton, Segmented } from "@/components/ui/Bits";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { DISTRICTS, ELECTION_STATE, LGA_DISTRICT, STATES, STATES_LGAS } from "@/lib/constants";
import { checkRegistrationAvailability, registerVoter, startFaceChallenge } from "@/lib/supabase-actions";
import { cn, formatDate } from "@/lib/utils";
import { registrationSchema, type RegistrationInput } from "@/lib/validation";
import type { FaceFrame } from "@/types";

const STEPS = [
	{ label: "Personal details", sub: "Name, NIN, contact" },
	{ label: "Location", sub: "Origin and residence" },
	{ label: "Face enrolment", sub: "Live guided scan" },
	{ label: "Review", sub: "Confirm and submit" },
];

const STEP_FIELDS: FieldPath<RegistrationInput>[][] = [
	["first_name", "middle_name", "last_name", "date_of_birth", "gender", "email", "phone", "nin", "occupation"],
	["origin_state", "origin_lga", "home_address", "home_state", "home_lga"],
	[],
	["consent"],
];

const ONDO_LGAS = STATES_LGAS[ELECTION_STATE] ?? [];
const slide = { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -24 }, transition: { duration: 0.3 } };

export function RegisterFlow() {
	const [step, setStep] = useState(0);
	const [checking, setChecking] = useState(false);
	const [challenge, setChallenge] = useState<{ id: string; direction: "left" | "right" } | null>(null);
	const [frames, setFrames] = useState<FaceFrame[] | null>(null);
	const [faceError, setFaceError] = useState<string | null>(null);
	const [resetKey, setResetKey] = useState(0);
	const [done, setDone] = useState<{ vin: string; email: string } | null>(null);

	const form = useForm<RegistrationInput>({
		resolver: zodResolver(registrationSchema),
		mode: "onTouched",
		defaultValues: { home_state: ELECTION_STATE, middle_name: "", gender: undefined, consent: false as unknown as true },
	});
	const { register, setValue, setError, trigger, getValues, control, formState } = form;
	const errors = formState.errors;
	const [originState, homeLga, gender] = useWatch({ control, name: ["origin_state", "home_lga", "gender"] });

	const newChallenge = useCallback(async () => {
		setChallenge(null);
		setFrames(null);
		const res = await startFaceChallenge("register");
		if (!res.ok) return toast.error(res.error);
		setChallenge(res.data);
		setResetKey((k) => k + 1);
	}, []);

	useEffect(() => {
		if (step === 2 && !challenge) newChallenge();
	}, [step, challenge, newChallenge]);

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, [step]);

	const next = async () => {
		if (step === 2) {
			if (frames) setStep(3);
			return;
		}
		const ok = await trigger(STEP_FIELDS[step]);
		if (!ok) return;
		if (step === 0) {
			setChecking(true);
			const res = await checkRegistrationAvailability(getValues("email"), getValues("nin"));
			setChecking(false);
			if (!res.ok) return setError((res.field ?? "nin") as FieldPath<RegistrationInput>, { message: res.error });
		}
		if (step === 3) return submit();
		setStep((s) => s + 1);
	};

	const submit = async () => {
		if (!challenge || !frames) return setStep(2);
		setChecking(true);
		const res = await registerVoter(getValues(), challenge.id, frames);
		setChecking(false);
		if (res.ok) return setDone(res.data);
		if (res.field === "face") {
			setFaceError(res.error);
			setStep(2);
			newChallenge();
			return;
		}
		if (res.field) setError(res.field as FieldPath<RegistrationInput>, { message: res.error });
		const target = STEP_FIELDS.findIndex((f) => f.includes(res.field as FieldPath<RegistrationInput>));
		if (target >= 0 && target !== 3) setStep(target);
		toast.error(res.error);
	};

	if (done) return <Success vin={done.vin} email={done.email} />;

	const v = getValues();

	return (
		<div className="container-page flex flex-wrap items-start gap-8 py-12 pb-20">
			<aside className="flex flex-[1_1_260px] flex-col gap-7">
				<div className="flex flex-col gap-2.5">
					<h1 className="h-display text-[clamp(30px,3.4vw,40px)] font-extrabold leading-[1.05]">Register to vote</h1>
					<p className="leading-relaxed text-muted">About 4 minutes. Keep your NIN slip nearby and find a spot with even light.</p>
				</div>
				<div className="h-1.5 overflow-hidden rounded-md bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={step} aria-label="Registration progress">
					<div className="h-full rounded-md bg-brand transition-[width] duration-500" style={{ width: `${step * 25 + 12}%` }} />
				</div>
				<ol className="hidden flex-col gap-1.5 md:flex">
					{STEPS.map((s, i) => (
						<li key={s.label} aria-current={i === step ? "step" : undefined} className={cn("flex items-center gap-3.5 rounded-2xl p-3 transition-all", i === step && "bg-white shadow-[0_8px_24px_-16px_rgba(6,61,36,.4)]")}>
							<span className={cn("inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all", i < step ? "bg-brand text-white" : i === step ? "border-2 border-brand bg-white text-brand" : "bg-line text-subtle")}>
								{i < step ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
							</span>
							<span className="flex flex-col">
								<b className="text-[15px]">{s.label}</b>
								<span className="text-[13px] text-subtle">{s.sub}</span>
							</span>
						</li>
					))}
				</ol>
				<p className="hidden gap-3 rounded-2xl border border-line bg-white p-4 text-[13px] leading-relaxed text-muted md:flex">
					<Lock className="h-[22px] w-[22px] shrink-0 text-brand" aria-hidden />
					Your NIN is stored as a one-way hash and your photo in private storage. They are only used to confirm your identity on election day.
				</p>
			</aside>

			<section className="min-w-0 flex-[999_1_560px] rounded-[28px] border border-line bg-white p-[clamp(20px,4vw,40px)] shadow-card">
				<form onSubmit={(e) => (e.preventDefault(), next())} noValidate>
					<AnimatePresence mode="wait">
						{step === 0 && (
							<motion.div key="s0" {...slide} className="flex flex-col gap-5">
								<StepHeader n={1} title="Personal details" />
								<div className="grid gap-[18px] sm:grid-cols-3">
									<Field label="First name" error={errors.first_name?.message}>{(p) => <Input {...p} autoComplete="given-name" {...register("first_name")} />}</Field>
									<Field label="Middle name" hint="Optional" error={errors.middle_name?.message}>{(p) => <Input {...p} autoComplete="additional-name" {...register("middle_name")} />}</Field>
									<Field label="Last name" error={errors.last_name?.message}>{(p) => <Input {...p} autoComplete="family-name" {...register("last_name")} />}</Field>
								</div>
								<div className="grid gap-[18px] sm:grid-cols-2">
									<Field label="Date of birth" hint="You must be 18 or older." error={errors.date_of_birth?.message}>{(p) => <Input {...p} type="date" max={new Date().toISOString().slice(0, 10)} {...register("date_of_birth")} />}</Field>
									<div className="flex flex-col gap-2">
										<span className="text-sm font-semibold text-[#26362D]" id="gender-label">Gender</span>
										<Segmented label="Gender" value={(gender ?? "") as "female" | "male"} onChange={(g) => setValue("gender", g, { shouldValidate: true })} options={[{ value: "female", label: "Female" }, { value: "male", label: "Male" }]} className="w-full" />
										{errors.gender && <p role="alert" className="text-[13px] font-medium text-danger">{errors.gender.message}</p>}
									</div>
								</div>
								<div className="grid gap-[18px] sm:grid-cols-2">
									<Field label="Email address" hint="We send your VIN and sign-in codes here." error={errors.email?.message}>{(p) => <Input {...p} type="email" autoComplete="email" {...register("email")} />}</Field>
									<Field label="Phone number" error={errors.phone?.message}>
										{(p) => (
											<span className="flex">
												<span className="inline-flex items-center rounded-l-xl border border-r-0 border-[#D5DDD4] bg-ground px-3 font-semibold text-muted">+234</span>
												<Input {...p} inputMode="tel" autoComplete="tel-national" placeholder="803 123 4567" className="rounded-l-none" {...register("phone")} />
											</span>
										)}
									</Field>
								</div>
								<div className="grid gap-[18px] sm:grid-cols-2">
									<Field label="National Identification Number (NIN)" hint="11 digits, from your NIN slip" error={errors.nin?.message}>{(p) => <Input {...p} inputMode="numeric" maxLength={11} autoComplete="off" className="font-mono tracking-[0.12em]" {...register("nin")} />}</Field>
									<Field label="Occupation" error={errors.occupation?.message}>{(p) => <Input {...p} autoComplete="organization-title" {...register("occupation")} />}</Field>
								</div>
							</motion.div>
						)}

						{step === 1 && (
							<motion.div key="s1" {...slide} className="flex flex-col gap-5">
								<StepHeader n={2} title="Where you are from and where you live" />
								<h3 className="text-[15px] font-semibold text-subtle">Origin</h3>
								<div className="grid gap-[18px] sm:grid-cols-2">
									<Field label="State of origin" error={errors.origin_state?.message}>
										{(p) => (
											<Select {...p} {...register("origin_state", { onChange: () => setValue("origin_lga", "") })} defaultValue="">
												<option value="" disabled>Choose a state</option>
												{STATES.map((s) => <option key={s}>{s}</option>)}
											</Select>
										)}
									</Field>
									<Field label="LGA of origin" error={errors.origin_lga?.message}>
										{(p) => (
											<Select {...p} {...register("origin_lga")} defaultValue="" disabled={!originState}>
												<option value="" disabled>{originState ? "Choose an LGA" : "Choose a state first"}</option>
												{(STATES_LGAS[originState] ?? []).map((l) => <option key={l}>{l}</option>)}
											</Select>
										)}
									</Field>
								</div>
								<h3 className="mt-2 text-[15px] font-semibold text-subtle">Residence (where you will vote)</h3>
								<Field label="Residential address" error={errors.home_address?.message}>{(p) => <Input {...p} autoComplete="street-address" {...register("home_address")} />}</Field>
								<div className="grid gap-[18px] sm:grid-cols-2">
									<Field label="State of residence" hint={`Elections here are for ${ELECTION_STATE} State.`}>
										{(p) => <Input {...p} value={ELECTION_STATE} readOnly className="bg-ground" />}
									</Field>
									<Field label="LGA of residence" error={errors.home_lga?.message}>
										{(p) => (
											<Select {...p} {...register("home_lga")} defaultValue="">
												<option value="" disabled>Choose an LGA</option>
												{ONDO_LGAS.map((l) => <option key={l}>{l}</option>)}
											</Select>
										)}
									</Field>
								</div>
								<AnimatePresence>
									{homeLga && LGA_DISTRICT[homeLga] && (
										<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3.5 rounded-2xl bg-brand-50 px-[18px] py-4 text-forest">
											<MapPin className="h-6 w-6 shrink-0" aria-hidden />
											<span className="text-[15px] leading-snug">
												You will vote in <b>{DISTRICTS[LGA_DISTRICT[homeLga]!]} senatorial district</b>. We worked this out from your LGA.
											</span>
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						)}

						{step === 2 && (
							<motion.div key="s2" {...slide} className="flex flex-col gap-5">
								<StepHeader n={3} title="Enrol your face" sub="This becomes the reference we match you against on election day." />
								{faceError && <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm font-medium text-danger">{faceError}</p>}
								<FaceCapture
									direction={challenge?.direction ?? null}
									resetKey={resetKey}
									onComplete={(f) => {
										setFaceError(null);
										setFrames(f);
									}}
									onRetry={newChallenge}
								/>
							</motion.div>
						)}

						{step === 3 && (
							<motion.div key="s3" {...slide} className="flex flex-col gap-5">
								<StepHeader n={4} title="Check and submit" />
								<div className="flex flex-wrap items-center gap-5 rounded-[20px] bg-ground p-5">
									{frames && (
										// eslint-disable-next-line @next/next/no-img-element
										<img src={frames.find((f) => f.kind === "front")!.dataUrl} alt="Your enrolment photo" className="h-[100px] w-[84px] rounded-2xl object-cover" />
									)}
									<div className="flex flex-col gap-1">
										<b className="text-xl">{[v.first_name, v.middle_name, v.last_name].filter(Boolean).join(" ")}</b>
										<span className="capitalize text-muted">
											{v.gender} · {v.date_of_birth && formatDate(v.date_of_birth)} · {v.occupation}
										</span>
										<span className="text-[13px] font-semibold text-brand">Face captured with liveness check</span>
									</div>
								</div>
								<dl className="grid overflow-hidden rounded-[18px] border border-line sm:grid-cols-2">
									<Summary label="Email" value={v.email} onEdit={() => setStep(0)} />
									<Summary label="Phone" value={`+234 ${String(v.phone ?? "").replace(/^0/, "")}`} onEdit={() => setStep(0)} />
									<Summary label="NIN" value={`••••••• ${String(v.nin ?? "").slice(-4)}`} mono onEdit={() => setStep(0)} />
									<Summary label="Origin" value={`${v.origin_lga}, ${v.origin_state}`} onEdit={() => setStep(1)} />
									<Summary label="Residence" value={`${v.home_address}, ${v.home_lga}, ${v.home_state}`} onEdit={() => setStep(1)} />
									<Summary label="Senatorial district" value={v.home_lga ? DISTRICTS[LGA_DISTRICT[v.home_lga]!] : ""} />
								</dl>
								<label className="flex cursor-pointer items-start gap-3 text-[15px] leading-relaxed text-[#26362D]">
									<input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-brand" {...register("consent")} />
									I confirm these details are correct and agree to my NIN and face data being processed to verify my identity for elections, under the Nigeria Data Protection Act 2023.
								</label>
								{errors.consent && <p role="alert" className="text-[13px] font-medium text-danger">{errors.consent.message}</p>}
							</motion.div>
						)}
					</AnimatePresence>

					<div className="mt-8 flex justify-between gap-3 border-t border-line pt-6">
						<Button variant="secondary" size="lg" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || checking}>
							Back
						</Button>
						<Button type="submit" size="lg" loading={checking} disabled={step === 2 && !frames} lift>
							{step === 3 ? "Submit registration" : "Continue"}
							{!checking && <ArrowRight className="h-5 w-5" aria-hidden />}
						</Button>
					</div>
				</form>
			</section>
		</div>
	);
}

function StepHeader({ n, title, sub }: { n: number; title: string; sub?: string }) {
	return (
		<header className="flex flex-col gap-1">
			<span className="text-[13px] font-bold tracking-[0.06em] text-brand">STEP {n} OF 4</span>
			<h2 className="h-display text-[28px]">{title}</h2>
			{sub && <p className="text-muted">{sub}</p>}
		</header>
	);
}

function Summary({ label, value, mono, onEdit }: { label: string; value: string; mono?: boolean; onEdit?: () => void }) {
	return (
		<div className="flex items-start justify-between gap-3 border-b border-line px-[18px] py-4 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
			<div className="min-w-0">
				<dt className="text-[13px] text-subtle">{label}</dt>
				<dd className={cn("mt-1 break-words font-semibold", mono && "font-mono")}>{value}</dd>
			</div>
			{onEdit && (
				<button type="button" onClick={onEdit} aria-label={`Edit ${label.toLowerCase()}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-brand hover:bg-brand-50">
					<Pencil className="h-4 w-4" />
				</button>
			)}
		</div>
	);
}

function Success({ vin, email }: { vin: string; email: string }) {
	return (
		<div className="container-page py-16">
			<section className="mx-auto flex max-w-[640px] flex-col items-center gap-[18px] rounded-[28px] border border-line bg-white px-6 py-12 text-center shadow-card">
				<AnimatedCheck />
				<h1 className="h-display mt-2 animate-rise text-[34px] font-extrabold">You are registered</h1>
				<p className="max-w-[440px] animate-rise leading-relaxed text-muted [animation-delay:.1s]">
					Here is your Voter ID Number. We have also emailed it to <b>{email}</b>. Keep it private: you need it to vote.
				</p>
				<div className="flex animate-rise flex-wrap items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-[#9BD3AF] bg-[#F3FAF5] py-2.5 pl-5 pr-2.5 [animation-delay:.2s]">
					<span className="font-mono text-[clamp(20px,3vw,28px)] font-bold tracking-[0.08em] text-forest">{vin}</span>
					<CopyButton text={vin} />
				</div>
				<div className="mt-2 flex flex-wrap justify-center gap-3">
					<ButtonLink href="/card" size="lg" lift>
						<IdCard className="h-5 w-5" aria-hidden /> Get my voter card
					</ButtonLink>
					<ButtonLink href="/" size="lg" variant="secondary">
						Back to home
					</ButtonLink>
				</div>
			</section>
		</div>
	);
}
