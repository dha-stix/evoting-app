import { Flag, ScanFace, Users, Vote, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { LiveDot } from "@/components/ui/Bits";
import { ButtonLink } from "@/components/ui/Button";
import { rankCandidates } from "@/components/results/TallyBars";
import type { Overview, ElectionWithBallot } from "@/lib/queries";
import { formatDate, formatNumber, percent, timeAgo } from "@/lib/utils";
import type { AuditEntry, ElectionStatus } from "@/types";

function sparkPoints(values: number[]) {
	const max = Math.max(...values, 1);
	const min = Math.min(...values, 0);
	return values.map((v, i) => `${((i / Math.max(values.length - 1, 1)) * 200).toFixed(0)},${(32 - ((v - min) / (max - min || 1)) * 28).toFixed(1)}`).join(" ");
}

export function StatCard({ label, value, note, icon: Icon, series, color = "#0A6B3D", delay = 0 }: { label: string; value: string; note?: string; icon: LucideIcon; series?: number[]; color?: string; delay?: number }) {
	return (
		<div className="card lift flex animate-rise flex-col gap-2.5 rounded-[22px] p-5" style={{ animationDelay: `${delay}s` }}>
			<div className="flex items-center justify-between">
				<span className="text-sm font-semibold text-subtle">{label}</span>
				<span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand">
					<Icon className="h-[18px] w-[18px]" aria-hidden />
				</span>
			</div>
			<span className="h-display text-[34px] font-extrabold tabular-nums tracking-[-0.02em]">{value}</span>
			{note && <span className="text-[13px] font-semibold text-brand">{note}</span>}
			{series && (
				<svg viewBox="0 0 200 36" preserveAspectRatio="none" className="h-9 w-full" aria-hidden>
					<polyline points={sparkPoints(series)} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 400, strokeDashoffset: 400, animation: "draw 1.6s ease forwards .3s" }} />
				</svg>
			)}
		</div>
	);
}

export function OverviewStats({ overview, elections }: { overview: Overview; elections: (ElectionWithBallot & { status: ElectionStatus })[] }) {
	const regs = overview.registrations.map((r) => r.count);
	const live = elections.filter((e) => e.status === "live");
	const votesToday = live.reduce((s, e) => s + (overview.participation[String(e.id)] ?? 0), 0);
	const verify = overview.verifications_today;
	return (
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<StatCard label="Registered voters" value={formatNumber(overview.voters)} note={`${percent(overview.face_enrolled, overview.voters)} with face enrolled`} icon={Users} series={regs} />
			<StatCard label="Votes in live elections" value={formatNumber(votesToday)} note={live.length ? "Updating live" : "No election live"} icon={Vote} color="#13A35E" delay={0.06} />
			<StatCard label="Face checks today" value={formatNumber(verify.total)} note={verify.total ? `${percent(verify.success, verify.total)} passed` : "None yet"} icon={ScanFace} color="#B45309" delay={0.12} />
			<StatCard label="Registered parties" value={formatNumber(overview.parties)} note="Recognised by INEC" icon={Flag} color="#1D4ED8" delay={0.18} />
		</div>
	);
}

export function LiveElectionCard({ election, voted }: { election?: ElectionWithBallot; voted: number }) {
	if (!election) {
		return (
			<section className="flex flex-[1_1_360px] animate-rise flex-col justify-between gap-5 rounded-[26px] bg-forest p-7 text-white">
				<div className="flex flex-col gap-3">
					<span className="text-[13px] font-bold tracking-[0.06em] text-[#86EFAC]">NO ELECTION LIVE</span>
					<h2 className="h-display text-[28px]">Schedule the next election</h2>
					<p className="text-[#C9E7D3]">Pick the office, opening and closing times, and the candidates. It opens and closes on its own.</p>
				</div>
				<ButtonLink href="/admin/elections" variant="light" className="self-start">
					Go to elections
				</ButtonLink>
			</section>
		);
	}
	const { rows, total } = rankCandidates(election.candidates, election.tallies);
	const leader = rows[0];
	return (
		<section className="flex flex-[1_1_360px] animate-rise flex-col gap-5 rounded-[26px] bg-forest p-7 text-white">
			<div className="flex items-center justify-between gap-3">
				<span className="inline-flex items-center gap-2 text-[13px] font-bold tracking-[0.06em] text-[#86EFAC]">
					<LiveDot className="bg-[#4ADE80]" /> LIVE ELECTION
				</span>
				<span className="text-sm text-[#C9E7D3]">Closes {formatDate(election.ends_at)}</span>
			</div>
			<h2 className="h-display text-[28px]">{election.title}</h2>
			<dl className="grid grid-cols-2 gap-x-6 gap-y-3.5">
				<div>
					<dt className="text-[13px] text-[#9CC7AE]">Votes cast</dt>
					<dd className="mt-0.5 text-xl font-bold tabular-nums">{formatNumber(total)}</dd>
				</div>
				<div>
					<dt className="text-[13px] text-[#9CC7AE]">Leading</dt>
					<dd className="mt-0.5 truncate text-xl font-bold">{leader?.votes ? `${leader.candidate.party?.acronym} · ${leader.share.toFixed(0)}%` : "—"}</dd>
				</div>
				<div>
					<dt className="text-[13px] text-[#9CC7AE]">Voters who voted</dt>
					<dd className="mt-0.5 text-xl font-bold tabular-nums">{formatNumber(voted)}</dd>
				</div>
				<div>
					<dt className="text-[13px] text-[#9CC7AE]">Candidates</dt>
					<dd className="mt-0.5 text-xl font-bold">{election.candidates.length}</dd>
				</div>
			</dl>
			<div className="flex flex-wrap gap-2.5">
				<ButtonLink href="/admin/elections" variant="light" size="sm" className="h-11">
					Manage
				</ButtonLink>
				<ButtonLink href="/results" variant="outlineLight" size="sm" className="h-11">
					Public results
				</ButtonLink>
			</div>
		</section>
	);
}

export function RegistrationsChart({ data }: { data: { day: string; count: number }[] }) {
	const max = Math.max(...data.map((d) => d.count), 1);
	const total = data.reduce((s, d) => s + d.count, 0);
	return (
		<section className="card flex min-w-0 flex-[1.4_1_420px] animate-rise flex-col gap-4 rounded-[26px] p-7 [animation-delay:.1s]">
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<h2 className="h-display text-[22px]">New registrations</h2>
				<span className="text-sm text-subtle">{formatNumber(total)} in the last 14 days</span>
			</div>
			<div className="grid h-[200px] grid-cols-[repeat(14,minmax(0,1fr))] items-end gap-1.5 border-b border-line sm:gap-2">
				{data.map((d, i) => (
					<div key={d.day} className="group relative flex h-full items-end">
						<div
							className="w-full origin-bottom animate-grow-up rounded-t-lg"
							style={{ height: `${Math.max((d.count / max) * 100, d.count ? 4 : 1.5)}%`, background: i === data.length - 1 ? "#0A6B3D" : "#BFE3CB", animationDelay: `${i * 0.04}s` }}
						/>
						<span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
							{d.count} · {formatDate(d.day)}
						</span>
					</div>
				))}
			</div>
			<div className="flex justify-between text-xs text-subtle">
				<span>{data[0] && formatDate(data[0].day)}</span>
				<span>Today</span>
			</div>
		</section>
	);
}

export function ActivityFeed({ entries }: { entries: AuditEntry[] }) {
	const tone = (a: string) => (a.includes("deleted") || a.includes("ended") || a.includes("suspended") || a.includes("removed") ? "#B42318" : a.includes("created") || a.includes("scheduled") || a.includes("published") ? "#13A35E" : "#1D4ED8");
	return (
		<section className="card flex min-w-0 flex-[1.4_1_420px] flex-col gap-3.5 rounded-[26px] p-7">
			<div className="flex items-baseline justify-between">
				<h2 className="h-display text-[22px]">Recent activity</h2>
				<Link href="/admin/team" className="text-sm font-semibold text-brand hover:underline">
					Full audit log
				</Link>
			</div>
			{entries.length === 0 ? (
				<p className="text-muted">Nothing yet. Actions by your team appear here.</p>
			) : (
				<ul className="flex flex-col">
					{entries.map((e) => (
						<li key={e.id} className="flex items-center gap-3.5 border-b border-[#EEF2ED] py-3 last:border-0">
							<span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: tone(e.action) }} />
							<span className="min-w-0 flex-1 text-[15px]">{describe(e)}</span>
							<span className="whitespace-nowrap text-[13px] text-subtle">{timeAgo(e.created_at)}</span>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

export function describe(e: AuditEntry) {
	const d = e.details as Record<string, string>;
	const who = e.actor_email?.split("@")[0] ?? "Someone";
	const what = d.title ?? d.name ?? d.acronym ?? d.email ?? "";
	const verb = e.action.replace(".", " ").replace("_", " ");
	return `${who} · ${verb}${what ? ` · ${what}` : ""}`;
}
