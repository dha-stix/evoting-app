import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BallotBoard } from "@/components/vote/BallotBoard";
import { getBallotsForVoter } from "@/lib/queries";
import { readVoterSession } from "@/lib/session";
import { pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta({ title: "Your ballot", path: "/vote", noindex: true, description: "Sign in to vote in open Ondo State elections." });
export const dynamic = "force-dynamic";

export default async function BallotPage() {
	const session = await readVoterSession();
	if (!session || session.stage !== "ballot") redirect("/vote");
	const data = await getBallotsForVoter(session.voterId);
	if (!data) redirect("/vote");
	return <BallotBoard voter={data.voter} ballots={data.ballots} expiresAt={session.expiresAt} />;
}
