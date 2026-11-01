import type { Metadata } from "next";
import { VoterCardFlow } from "@/components/card/VoterCardFlow";
import { pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta({ title: "Voter card", path: "/card", image: "card", description: "Get your AuthVote voter card with photo and a verification QR code. Print the front and back at ID-card size and laminate them." });

export default function CardPage() {
	return <VoterCardFlow />;
}
