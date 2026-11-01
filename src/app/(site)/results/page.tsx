import type { Metadata } from "next";
import { LiveResults } from "@/components/results/LiveResults";
import { getPublicElections } from "@/lib/queries";
import { pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta({ title: "Live results", path: "/results", ownImage: true, description: "Follow Ondo State election results as votes are counted, with turnout by senatorial district and LGA, updated in real time." });
export const revalidate = 15;

export default async function ResultsPage() {
	const elections = await getPublicElections().catch(() => []);
	return <LiveResults elections={elections} />;
}
