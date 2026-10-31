import { CandidatesManager } from "@/components/admin/CandidatesManager";
import { getCandidates, getParties } from "@/lib/queries";
import { getCurrentAdmin } from "@/lib/supabase";

export const metadata = { title: "Candidates" };

export default async function AdminCandidatesPage() {
	const [admin, candidates, parties] = await Promise.all([getCurrentAdmin(), getCandidates(), getParties()]);
	return <CandidatesManager candidates={candidates} parties={parties} canManage={admin?.role !== "observer"} />;
}
