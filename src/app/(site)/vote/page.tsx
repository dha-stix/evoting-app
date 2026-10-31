import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInFlow } from "@/components/vote/SignInFlow";
import { readVoterSession } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in to vote" };
export const dynamic = "force-dynamic";

export default async function VotePage() {
	const session = await readVoterSession();
	if (session?.stage === "ballot") redirect("/vote/ballot");
	const step = session?.stage === "face" ? 2 : session?.stage === "pending" ? 1 : 0;
	return <SignInFlow initialStep={step} />;
}
