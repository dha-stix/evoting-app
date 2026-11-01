import { createClient } from "@supabase/supabase-js";
import { OG_SIZE, OG_TYPE, renderOg } from "@/lib/og";

export const runtime = "edge";
export const alt = "Live Ondo State election results on AuthVote";
export const size = OG_SIZE;
export const contentType = OG_TYPE;
// Shared links show the count as of the last minute.
export const revalidate = 60;

type Row = { name: string; acronym: string; color: string; votes: number };

/** The live election (or the most recent one) with its top candidates. Public data only. */
async function leaderboard(): Promise<{ title: string; live: boolean; total: number; rows: Row[] } | null> {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !key) return null;
	const db = createClient(url, key, { auth: { persistSession: false } });
	const now = new Date().toISOString();
	const select = "title, starts_at, ends_at, election_candidates(candidate:candidates(id, full_name, party:parties(acronym, color))), election_tallies(candidate_id, votes)";
	const { data: live } = await db.from("elections").select(select).eq("is_draft", false).lte("starts_at", now).gt("ends_at", now).order("starts_at").limit(1);
	const { data: past } = live?.length ? { data: null } : await db.from("elections").select(select).eq("is_draft", false).lte("ends_at", now).order("ends_at", { ascending: false }).limit(1);
	const e = (live?.[0] ?? past?.[0]) as
		| { title: string; election_candidates: { candidate: { id: number; full_name: string; party: { acronym: string; color: string } } }[]; election_tallies: { candidate_id: number; votes: number }[] }
		| undefined;
	if (!e) return null;
	const votes = new Map(e.election_tallies.map((t) => [t.candidate_id, t.votes]));
	const rows = e.election_candidates
		.map(({ candidate: c }) => ({ name: c.full_name, acronym: c.party.acronym, color: c.party.color, votes: votes.get(c.id) ?? 0 }))
		.sort((a, b) => b.votes - a.votes)
		.slice(0, 4);
	return { title: e.title, live: Boolean(live?.length), total: e.election_tallies.reduce((s, t) => s + t.votes, 0), rows };
}

function Board({ rows, total }: { rows: Row[]; total: number }) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 18, width: 380, padding: 28, borderRadius: 28, background: "#FFFFFF", color: "#0D1B14" }}>
			{rows.map((r) => {
				const share = total ? Math.round((r.votes / total) * 1000) / 10 : 0;
				return (
					<div key={r.name} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 20 }}>
							<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
								<div style={{ display: "flex", padding: "3px 10px", borderRadius: 999, background: r.color, color: "#fff", fontSize: 15, fontWeight: 600 }}>{r.acronym}</div>
								<div style={{ display: "flex", fontWeight: 600 }}>{r.name.length > 18 ? `${r.name.slice(0, 17)}…` : r.name}</div>
							</div>
							<div style={{ display: "flex", fontWeight: 600 }}>{share}%</div>
						</div>
						<div style={{ display: "flex", height: 12, borderRadius: 12, background: "#EEF2ED" }}>
							<div style={{ display: "flex", width: `${Math.max(share, 1.5)}%`, height: 12, borderRadius: 12, background: r.color }} />
						</div>
					</div>
				);
			})}
		</div>
	);
}

export default async function Image() {
	// No photo here: the live numbers are the point, and it keeps the image small for WhatsApp.
	const board = await leaderboard().catch(() => null);
	if (!board || board.rows.length === 0) {
		return renderOg({ eyebrow: "Live results", title: "Watch the count as it happens.", subtitle: "Ondo State results update the moment each vote is recorded, with turnout by district and LGA." });
	}
	return renderOg({
		eyebrow: board.live ? "Live now" : "Final results",
		title: board.title,
		subtitle: `${board.total.toLocaleString("en-NG")} ${board.total === 1 ? "vote" : "votes"} counted${board.live ? " so far. Updating in real time." : "."}`,
		side: <Board rows={board.rows} total={board.total} />,
	});
}
