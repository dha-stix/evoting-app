"use client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BarChart3, Check, Clock, LogOut } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AnimatedCheck, Pill } from "@/components/ui/Bits";
import { BallotMark, PartyBadge, Silhouette } from "@/components/ui/Brand";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import { DISTRICTS, ELECTION_TYPE_LABEL, STORAGE } from "@/lib/constants";
import { castVote, signOutVoter } from "@/lib/supabase-actions";
import { cn, countdown, initials, publicStorageUrl } from "@/lib/utils";
import type { Candidate, Election } from "@/types";

export interface Ballot extends Election {
	candidates: Candidate[];
	voted: boolean;
}

interface Props {
	voter: { first_name: string; last_name: string; district: keyof typeof DISTRICTS };
	ballots: Ballot[];
	expiresAt: number;
}

export function BallotBoard({ voter, ballots, expiresAt }: Props) {
	const [active, setActive] = useState(ballots.find((b) => !b.voted)?.id ?? ballots[0]?.id);
	const [selected, setSelected] = useState<Record<number, number>>({});
	const [receipts, setReceipts] = useState<Record<number, string>>({});
	const [confirming, setConfirming] = useState(false);
	const [casting, setCasting] = useState(false);
	const [now, setNow] = useState(Date.now());

	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, []);

	const remaining = expiresAt - now;
	const expired = remaining <= 0;
	const isDone = (b: Ballot) => b.voted || Boolean(receipts[b.id]);
	const allDone = ballots.length > 0 && ballots.every(isDone);
	const ballot = ballots.find((b) => b.id === active);
	const choice = ballot ? ballot.candidates.find((c) => c.id === selected[ballot.id]) : undefined;
	const title = (b: Election) => (b.type === "senatorial" && b.district ? `Senatorial · ${DISTRICTS[b.district]}` : ELECTION_TYPE_LABEL[b.type]);

	const cast = async () => {
		if (!ballot || !choice) return;
		setCasting(true);
		const res = await castVote(ballot.id, choice.id);
		setCasting(false);
		setConfirming(false);
		if (!res.ok) return toast.error(res.error);
		setReceipts((r) => ({ ...r, [ballot.id]: res.data.receipt }));
	};

	const nextOpen = useMemo(() => ballots.find((b) => b.id !== active && !isDone(b)), [ballots, active, receipts]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className="min-h-screen bg-ground pb-32">
			<header className="sticky top-0 z-30 border-b border-line bg-white">
				<div className="mx-auto flex h-[68px] max-w-[1100px] items-center justify-between gap-3 px-4 sm:px-5">
					<span className="inline-flex items-center gap-2.5 font-display text-xl font-extrabold">
						<span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand text-white">
							<BallotMark className="h-[18px] w-[18px]" />
						</span>
						<span className="hidden sm:inline">AuthVote</span>
					</span>
					<div className="flex items-center gap-2.5">
						<span role="timer" aria-label="Session time left" className={cn("inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-sm font-semibold tabular-nums", remaining < 120_000 ? "bg-danger-bg text-danger" : "bg-warn-bg text-warn")}>
							<Clock className="h-[18px] w-[18px]" aria-hidden />
							{expired ? "Expired" : countdown(remaining)}
						</span>
						<span className="hidden h-10 items-center gap-2.5 rounded-full border border-line py-0 pl-1.5 pr-3.5 text-sm font-semibold sm:inline-flex">
							<span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-forest">{initials(`${voter.first_name} ${voter.last_name}`)}</span>
							{voter.first_name} {voter.last_name[0]}. · {DISTRICTS[voter.district]}
						</span>
						<form action={signOutVoter}>
							<button type="submit" aria-label="Sign out" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted hover:text-ink">
								<LogOut className="h-[18px] w-[18px]" />
							</button>
						</form>
					</div>
				</div>
			</header>

			<main className="mx-auto flex max-w-[1100px] flex-col gap-7 px-4 pt-9 sm:px-5">
				{ballots.length === 0 ? (
					<Empty message="There is no open election for your district right now." />
				) : expired && !allDone ? (
					<Empty message="Your voting session has ended for security. Sign in again to finish voting." action={<ButtonLink href="/vote">Sign in again</ButtonLink>} />
				) : allDone ? (
					<motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4 rounded-[28px] border border-line bg-white p-[clamp(28px,5vw,56px)] text-center">
						<AnimatedCheck size={96} />
						<h1 className="h-display mt-2 text-[clamp(30px,4vw,42px)] font-extrabold">Thank you for voting</h1>
						<p className="max-w-[480px] leading-relaxed text-muted">All your ballots are recorded. Save your receipt codes: they prove your ballot was counted, not who you chose.</p>
						<div className="flex flex-wrap justify-center gap-3">
							{ballots.map((b) =>
								receipts[b.id] ? (
									<span key={b.id} className="rounded-xl border border-dashed border-[#9BD3AF] bg-[#F3FAF5] px-4 py-3 font-mono font-bold">
										{ELECTION_TYPE_LABEL[b.type].slice(0, 3).toUpperCase()} · {receipts[b.id]}
									</span>
								) : null,
							)}
						</div>
						<form action={signOutVoter} className="mt-2">
							<Button type="submit" size="lg" lift>
								<BarChart3 className="h-5 w-5" aria-hidden /> Finish and watch results
							</Button>
						</form>
					</motion.section>
				) : (
					<>
						<div className="flex flex-col gap-1.5">
							<h1 className="h-display text-[clamp(28px,3.6vw,40px)] font-extrabold">Your ballots</h1>
							<p className="text-muted">Choose one candidate per ballot. You cannot change a vote once it is cast.</p>
						</div>
						{ballots.length > 1 && (
							<div role="tablist" aria-label="Ballots" className="grid gap-2 rounded-[18px] bg-[#E9EEE8] p-1.5" style={{ gridTemplateColumns: `repeat(${ballots.length}, minmax(0, 1fr))` }}>
								{ballots.map((b) => {
									const on = b.id === active;
									return (
										<button key={b.id} type="button" role="tab" aria-selected={on} onClick={() => setActive(b.id)} className={cn("flex min-h-16 items-center justify-between gap-2.5 rounded-[14px] px-4 py-2.5 text-left transition-all", on ? "bg-white shadow-[0_6px_18px_-10px_rgba(0,0,0,.25)]" : "")}>
											<span className="flex min-w-0 flex-col">
												<b>{ELECTION_TYPE_LABEL[b.type]}</b>
												<span className="truncate text-[13px] text-subtle">{b.district ? DISTRICTS[b.district] : "Ondo State"}</span>
											</span>
											{isDone(b) ? <Pill tone="dark">Voted</Pill> : <Pill tone="amber">Open</Pill>}
										</button>
									);
								})}
							</div>
						)}

						{ballot && isDone(ballot) ? (
							<motion.section key={`done-${ballot.id}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-5 rounded-3xl border border-[#BFE3CB] bg-white p-8">
								<AnimatedCheck size={64} className="shadow-none" />
								<div className="min-w-[220px] flex-1">
									<h2 className="h-display text-2xl">Vote recorded</h2>
									<p className="mt-1 text-muted">
										{receipts[ballot.id] ? (
											<>
												Receipt <b className="font-mono">{receipts[ballot.id]}</b> · stored without your identity
											</>
										) : (
											"You already voted in this election."
										)}
									</p>
								</div>
								{nextOpen && (
									<Button onClick={() => setActive(nextOpen.id)} lift>
										Next ballot
									</Button>
								)}
							</motion.section>
						) : ballot ? (
							<section aria-label={title(ballot)}>
								<h2 className="mb-4 font-semibold text-muted">{ballot.title}</h2>
								<div role="radiogroup" aria-label={`${title(ballot)} candidates`} className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-4">
									{ballot.candidates.map((c, i) => {
										const on = selected[ballot.id] === c.id;
										const photo = publicStorageUrl(STORAGE.candidatePhotos, c.photo_path);
										return (
											<motion.button
												key={c.id}
												type="button"
												role="radio"
												aria-checked={on}
												onClick={() => setSelected((s) => ({ ...s, [ballot.id]: c.id }))}
												initial={{ opacity: 0, y: 16 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: i * 0.05 }}
												whileHover={{ y: -3 }}
												whileTap={{ scale: 0.98 }}
												className={cn("flex flex-col gap-3.5 rounded-3xl border-2 p-[18px] text-left transition-colors", on ? "border-brand bg-[#F3FAF5] ring-4 ring-brand/10" : "border-line bg-white hover:border-brand/40")}
											>
												<span className="flex w-full items-start justify-between">
													{c.party && <PartyBadge party={c.party} size={48} />}
													<span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full text-white transition-colors", on ? "bg-brand" : "border-2 border-[#CBD5CA]")}>{on && <Check className="h-4 w-4" strokeWidth={3} />}</span>
												</span>
												<span className="relative flex aspect-[4/3] w-full items-end justify-center overflow-hidden rounded-2xl bg-[#EEF2ED]">
													{photo ? <Image src={photo} alt="" fill sizes="(max-width: 640px) 100vw, 260px" className="object-cover" /> : <Silhouette className="h-[88%] w-[62%]" />}
												</span>
												<span className="flex flex-col gap-0.5">
													<b className="text-lg">{c.full_name}</b>
													<span className="text-sm text-subtle">
														{c.party?.name} ({c.party?.acronym})
													</span>
													{c.running_mate && <span className="text-[13px] text-subtle">Running mate: {c.running_mate}</span>}
												</span>
											</motion.button>
										);
									})}
								</div>
							</section>
						) : null}
					</>
				)}
			</main>

			<AnimatePresence>
				{ballot && !isDone(ballot) && !expired && !allDone && (
					<motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-4 py-3.5 backdrop-blur sm:px-5">
						<div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4">
							<span className="min-w-0 truncate text-[15px] text-muted">{choice ? `Selected: ${choice.full_name} · ${choice.party?.acronym}` : "Tap a candidate to select"}</span>
							<Button size="lg" disabled={!choice} onClick={() => setConfirming(true)} lift>
								Review &amp; cast
							</Button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<Modal open={confirming} onClose={() => !casting && setConfirming(false)} title="Confirm your vote" role="alertdialog">
				{ballot && choice && (
					<div className="flex flex-col gap-5">
						<h2 className="h-display text-[26px] font-extrabold">Cast this vote?</h2>
						<div className="flex items-center gap-3.5 rounded-[18px] border border-[#BFE3CB] bg-[#F3FAF5] p-4">
							{choice.party && <PartyBadge party={choice.party} size={52} />}
							<span className="flex flex-col">
								<span className="text-[13px] text-subtle">{title(ballot)}</span>
								<b className="text-lg">{choice.full_name}</b>
								<span className="text-sm text-muted">{choice.party?.name}</span>
							</span>
						</div>
						<p className="flex gap-2.5 text-sm leading-relaxed text-warn">
							<AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
							This is final. Your choice is stored anonymously and cannot be changed.
						</p>
						<div className="grid grid-cols-2 gap-2.5">
							<Button variant="secondary" size="lg" onClick={() => setConfirming(false)} disabled={casting} data-autofocus>
								Go back
							</Button>
							<Button size="lg" onClick={cast} loading={casting}>
								Cast vote
							</Button>
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
}

function Empty({ message, action }: { message: string; action?: React.ReactNode }) {
	return (
		<section className="flex flex-col items-center gap-4 rounded-[28px] border border-line bg-white p-12 text-center">
			<span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand">
				<BallotMark className="h-8 w-8" />
			</span>
			<p className="max-w-[420px] text-lg text-muted">{message}</p>
			{action ?? <ButtonLink href="/results" variant="secondary">See live results</ButtonLink>}
		</section>
	);
}
