import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInFlow } from "@/components/vote/SignInFlow";
import { readVoterSession } from "@/lib/session";
import { pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta({ title: "Sign in to vote", path: "/vote", image: "vote", description: "Polls are open. Sign in with your VIN, confirm the code we email you, pass a quick live face check and cast your secret ballot." });
export const dynamic = "force-dynamic";

export default async function VotePage() {
	const session = await readVoterSession();
	if (session?.stage === "ballot") redirect("/vote/ballot");
	const step = session?.stage === "face" ? 2 : session?.stage === "pending" ? 1 : 0;
	return <SignInFlow initialStep={step} />;
}
