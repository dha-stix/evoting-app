import type { Metadata } from "next";
import { LiveResults } from "@/components/results/LiveResults";
import { getPublicElections } from "@/lib/queries";

export const metadata: Metadata = { title: "Live results" };
export const revalidate = 15;

export default async function ResultsPage() {
	const elections = await getPublicElections().catch(() => []);
	return <LiveResults elections={elections} />;
}
