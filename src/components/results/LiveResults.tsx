"use client";
import { motion } from "framer-motion";
import { BadgeCheck, Clock, Search, Trophy, Users, Vote } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LiveDot, StatusPill } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";
import { DISTRICTS } from "@/lib/constants";
import { checkReceipt } from "@/lib/supabase-actions";
import { getBrowserClient } from "@/lib/supabase-browser";
import { cn, countdown, electionStatus, formatDate, formatNumber, percent } from "@/lib/utils";
import type { Candidate, Election, Tally, Turnout } from "@/types";
import { TallyBars, rankCandidates } from "./TallyBars";

export interface ResultsElection extends Election {
	candidates: Candidate[];
	tallies: Tally[];
}

export function LiveResults({ elections: initial }: { elections: ResultsElection[] }) {
	const [elections, setElections] = useState(initial);
	const ordered = useMemo(() => {
		const rank = { live: 0, scheduled: 1, ended: 2, draft: 3 } as const;
		return [...elections].sort((a, b) => rank[electionStatus(a)] - rank[electionStatus(b)] || +new Date(b.starts_at) - +new Date(a.starts_at));
	}, [elections]);
	const [selectedId, setSelectedId] = useState(ordered[0]?.id);
	const [turnout, setTurnout] = useState<Turnout | null>(null);
	const [updatedAt, setUpdatedAt] = useState(Date.now());
	const [now, setNow] = useState(Date.now());
	const selected = elections.find((e) => e.id === selectedId);
	const status = selected ? electionStatus(selected, now) : null;

	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, []);

	// Live tallies over Supabase Realtime.
	useEffect(() => {
		const supabase = getBrowserClient();
		const channel = supabase
			.channel("public-tallies")
			.on("postgres_changes", { event: "UPDATE", schema: "public", table: "election_tallies" }, (payload) => {
				const t = payload.new as Tally;
				setElections((list) => list.map((e) => (e.id === t.election_id ? { ...e, tallies: e.tallies.map((x) => (x.candidate_id === t.candidate_id ? t : x)) } : e)));
				setUpdatedAt(Date.now());
			})
			.on("postgres_changes", { event: "UPDATE", schema: "public", table: "elections" }, (payload) => {
				const e = payload.new as Election;
				setElections((list) => list.map((x) => (x.id === e.id ? { ...x, ...e } : x)));
			})
			.subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, []);

	const loadTurnout = useCallback(async () => {
		if (!selectedId) return;
		const { data } = await getBrowserClient().rpc("election_turnout", { p_election: selectedId });
		setTurnout(data as Turnout | null);
	}, [selectedId]);

	useEffect(() => {
		setTurnout(null);
		loadTurnout();
		if (status !== "live") return;
		const id = setInterval(loadTurnout, 20_000);
		return () => clearInterval(id);
	}, [loadTurnout, status]);

	if (!selected) {
		return (
			<div className="container-page py-20">
				<div className="card flex flex-col items-center gap-3 p-12 text-center">
					<Vote className="draw-in h-12 w-12 text-brand" strokeWidth={1.6} aria-hidden />
					<h1 className="h-display text-3xl">No elections yet</h1>
					<p className="text-muted">Results appear here the moment voting opens.</p>
				</div>
			</div>
		);
	}

	const { rows, total } = rankCandidates(selected.candidates, selected.tallies);
	const secondsAgo = Math.max(0, Math.round((now - updatedAt) / 1000));
	const tabs = ordered.filter((e) => electionStatus(e, now) !== "scheduled").slice(0, 4);

	const kpis = [
		{ icon: Vote, label: "Votes cast", value: formatNumber(total), note: status === "live" ? "Rising live" : "Final count" },
		{ icon: Users, label: "Turnout", value: turnout ? percent(turnout.voted, turnout.eligible) : "—", note: turnout ? `of ${formatNumber(turnout.eligible)} eligible` : "Loading…" },
		status === "live"
			? { icon: Clock, label: "Polls close in", value: countdown(+new Date(selected.ends_at) - now), note: formatDate(selected.ends_at) }
			: { icon: Clock, label: status === "ended" ? "Closed" : "Opens", value: formatDate(status === "ended" ? selected.ends_at : selected.starts_at), note: selected.ended_early_at ? "Ended early" : "" },
		{ icon: Trophy, label: status === "ended" ? "Winner" : "Leading", value: rows[0]?.votes ? rows[0].candidate.party?.acronym ?? "—" : "—", note: rows[0]?.votes ? rows[0].candidate.full_name : "No votes yet" },
	];

	return (
		<div className="container-page flex flex-col gap-7 py-10 pb-20">
			<div className="flex flex-wrap items-end justify-between gap-5">
				<div className="flex flex-col gap-2.5">
					{status === "live" ? (
						<span className="inline-flex h-8 items-center gap-2 self-start rounded-full bg-brand-50 px-3 text-[13px] font-bold tracking-[0.06em] text-brand">
							<LiveDot /> LIVE · UPDATED {secondsAgo < 3 ? "JUST NOW" : `${secondsAgo}S AGO`}
						</span>
					) : (
						status && <StatusPill status={status} />
					)}
					<h1 className="h-display text-[clamp(32px,4.4vw,52px)] font-extrabold leading-none tracking-[-0.035em]">Live results</h1>
				</div>
				{tabs.length > 1 && (
					<div role="tablist" aria-label="Election" className="flex flex-wrap gap-1.5 rounded-[14px] bg-[#E9EEE8] p-1">
						{tabs.map((e) => (
							<button key={e.id} type="button" role="tab" aria-selected={e.id === selectedId} onClick={() => setSelectedId(e.id)} className={cn("h-11 rounded-[10px] px-4 text-[15px] font-semibold transition-all", e.id === selectedId ? "bg-white text-ink shadow-[0_4px_12px_-6px_rgba(0,0,0,.25)]" : "text-subtle")}>
								{e.type === "governorship" ? "Governorship" : `Senatorial · ${DISTRICTS[e.district!]}`}
							</button>
						))}
					</div>
				)}
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{kpis.map(({ icon: Icon, label, value, note }, i) => (
					<motion.div key={label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card flex flex-col gap-2 rounded-[22px] p-[22px]">
						<span className="flex items-center justify-between text-sm font-semibold text-subtle">
							{label}
							<Icon className="h-[18px] w-[18px] text-brand" aria-hidden />
						</span>
						<span className="h-display truncate text-[32px] font-extrabold tabular-nums tracking-[-0.02em]">{value}</span>
						<span className="truncate text-[13px] font-semibold text-brand">{note}</span>
					</motion.div>
				))}
			</div>

			<div className="flex flex-wrap items-start gap-5">
				<section className="card flex min-w-0 flex-[999_1_560px] flex-col gap-6 rounded-[26px] p-[clamp(20px,3vw,32px)]">
					<div className="flex flex-wrap items-baseline justify-between gap-3">
						<h2 className="h-display text-2xl">{selected.title}</h2>
						<span className="text-sm text-subtle">{formatNumber(total)} {total === 1 ? "vote" : "votes"} counted</span>
					</div>
					{rows.length ? <TallyBars rows={rows} leaderLabel={status === "ended" ? "Winner" : "Leading"} /> : <p className="text-muted">No candidates on this ballot.</p>}
					<p className="text-[13px] text-subtle">{status === "ended" ? "Voting has closed. These are the final counts." : "Counts update as each vote is recorded and are provisional until voting closes."}</p>
				</section>

				<aside className="flex flex-[1_1_320px] flex-col gap-5">
					<section className="card flex flex-col gap-4 rounded-[26px] p-[26px]">
						<h2 className="h-display text-xl">Turnout by district</h2>
						{turnout?.by_district.length ? (
							turnout.by_district.map((d) => (
								<div key={d.district} className="flex flex-col gap-1.5">
									<div className="flex justify-between text-[15px]">
										<span>{DISTRICTS[d.district]}</span>
										<b className="tabular-nums">{percent(d.voted, d.eligible)}</b>
									</div>
									<div className="h-2 rounded-full bg-[#EEF2ED]">
										<div className="h-full rounded-full bg-brand-500 transition-[width] duration-700" style={{ width: percent(d.voted, d.eligible) }} />
									</div>
								</div>
							))
						) : (
							<p className="text-sm text-subtle">{turnout ? "No registered voters yet." : "Loading…"}</p>
						)}
					</section>
					<ReceiptCheck />
				</aside>
			</div>

			{ordered.length > tabs.length && (
				<section className="flex flex-col gap-3.5">
					<h2 className="h-display text-2xl">All elections</h2>
					<div className="grid gap-3.5 md:grid-cols-2">
						{ordered.map((e) => {
							const s = electionStatus(e, now);
							const r = rankCandidates(e.candidates, e.tallies);
							return (
								<button key={e.id} type="button" onClick={() => (setSelectedId(e.id), window.scrollTo({ top: 0, behavior: "smooth" }))} className={cn("card flex items-center justify-between gap-4 rounded-[20px] p-5 text-left transition-colors hover:border-brand/40", e.id === selectedId && "border-brand")}>
									<div className="min-w-0">
										<b className="block truncate">{e.title}</b>
										<span className="mt-1 block text-sm text-subtle">
											{s === "scheduled" ? `Opens ${formatDate(e.starts_at)}` : `${formatNumber(r.total)} votes · ${formatDate(e.ends_at)}`}
										</span>
									</div>
									{s === "ended" && r.rows[0]?.votes ? (
										<span className="whitespace-nowrap rounded-full bg-brand-50 px-2.5 py-1.5 text-[13px] font-bold text-brand">Won · {r.rows[0].candidate.party?.acronym}</span>
									) : (
										<StatusPill status={s} />
									)}
								</button>
							);
						})}
					</div>
				</section>
			)}
		</div>
	);
}

function ReceiptCheck() {
	const [code, setCode] = useState("");
	const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
	const [busy, setBusy] = useState(false);
	return (
		<section className="flex flex-col gap-3.5 rounded-[26px] bg-forest p-[26px] text-white">
			<h2 className="h-display text-xl">Check your receipt</h2>
			<p className="text-sm text-[#C9E7D3]">Confirm your ballot was counted. It never shows who you voted for.</p>
			<form
				onSubmit={async (e) => {
					e.preventDefault();
					setBusy(true);
					const res = await checkReceipt(code);
					setBusy(false);
					setResult(res.ok ? { ok: true, text: `Counted in ${res.data.election}` } : { ok: false, text: res.error });
				}}
				className="flex gap-2"
			>
				<label htmlFor="receipt" className="sr-only">Receipt code</label>
				<input id="receipt" value={code} onChange={(e) => setCode(e.target.value)} placeholder="AV-XXXXX-XXXXX" className="h-11 min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-3 font-mono uppercase text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#86EFAC]" />
				<Button type="submit" variant="light" size="sm" className="h-11" loading={busy} aria-label="Check receipt">
					<Search className="h-[18px] w-[18px]" aria-hidden />
				</Button>
			</form>
			{result && (
				<p role="status" className={cn("flex items-center gap-2 text-sm font-semibold", result.ok ? "text-[#86EFAC]" : "text-[#FCA5A5]")}>
					{result.ok && <BadgeCheck className="h-[18px] w-[18px]" aria-hidden />}
					{result.text}
				</p>
			)}
		</section>
	);
}
