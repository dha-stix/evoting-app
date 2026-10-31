import type { Metadata } from "next";
import { VoterCardFlow } from "@/components/card/VoterCardFlow";

export const metadata: Metadata = { title: "Voter card" };

export default function CardPage() {
	return <VoterCardFlow />;
}
