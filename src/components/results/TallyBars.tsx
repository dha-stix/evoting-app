import { PartyBadge } from "@/components/ui/Brand";
import { Pill } from "@/components/ui/Bits";
import { cn, formatNumber } from "@/lib/utils";
import type { Candidate, Tally } from "@/types";

export interface Row {
	candidate: Candidate;
	votes: number;
	share: number;
	leading: boolean;
}

export function rankCandidates(candidates: Candidate[], tallies: Tally[]): { rows: Row[]; total: number } {
	const votes = new Map(tallies.map((t) => [t.candidate_id, t.votes]));
	const total = tallies.reduce((s, t) => s + t.votes, 0);
	const rows = candidates
		.map((candidate) => ({ candidate, votes: votes.get(candidate.id) ?? 0 }))
		.sort((a, b) => b.votes - a.votes);
	const top = rows[0]?.votes ?? 0;
	return {
		total,
		rows: rows.map((r) => ({ ...r, share: total ? (r.votes / total) * 100 : 0, leading: top > 0 && r.votes === top })),
	};
}

export function TallyBars({ rows, compact, leaderLabel = "Leading" }: { rows: Row[]; compact?: boolean; leaderLabel?: string }) {
	return (
		<ul className={cn("flex flex-col", compact ? "gap-3.5" : "gap-6")}>
			{rows.map(({ candidate, votes, share, leading }) => (
				<li key={candidate.id} className="flex items-center gap-4">
					{!compact && candidate.party && <PartyBadge party={candidate.party} size={46} />}
					<div className="flex min-w-0 flex-1 flex-col gap-2">
						<div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
							<span className="inline-flex min-w-0 items-center gap-2">
								<b className={compact ? "text-[15px]" : "text-[17px]"}>{candidate.full_name}</b>
								<span className="text-sm text-subtle">{candidate.party?.acronym}</span>
								{leading && !compact && <Pill tone="dark">{leaderLabel.toUpperCase()}</Pill>}
							</span>
							<span className="text-[15px] tabular-nums">
								<b>{share.toFixed(1)}%</b>
								{!compact && <span className="text-subtle"> · {formatNumber(votes)}</span>}
							</span>
						</div>
						<div className={cn("overflow-hidden rounded-full bg-[#EEF2ED]", compact ? "h-2.5" : "h-3.5")}>
							<div className="h-full origin-left animate-grow rounded-full transition-[width] duration-700 ease-out" style={{ width: `${share}%`, background: candidate.party?.color ?? "#0A6B3D" }} />
						</div>
					</div>
				</li>
			))}
		</ul>
	);
}
