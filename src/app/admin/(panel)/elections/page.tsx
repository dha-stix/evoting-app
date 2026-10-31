import { Suspense } from "react";
import { ElectionsManager } from "@/components/admin/ElectionsManager";
import { getAdminElections, getCandidates } from "@/lib/queries";
import { createSessionClient, getCurrentAdmin } from "@/lib/supabase";

export const metadata = { title: "Elections" };

async function eligibleCounts() {
	const db = createSessionClient();
	const count = (district?: string) => {
		let q = db.from("voters").select("id", { count: "exact", head: true }).eq("status", "active");
		if (district) q = q.eq("district", district);
		return q.then((r) => r.count ?? 0);
	};
	const [state, north, central, south] = await Promise.all([count(), count("north"), count("central"), count("south")]);
	return { state, north, central, south };
}

export default async function AdminElectionsPage() {
	const db = createSessionClient();
	const [admin, elections, candidates, eligible, { data: overview }] = await Promise.all([getCurrentAdmin(), getAdminElections(), getCandidates(), eligibleCounts(), db.rpc("admin_overview")]);
	return (
		<Suspense>
			<ElectionsManager elections={elections} candidates={candidates} participation={overview?.participation ?? {}} eligible={eligible} canManage={admin?.role !== "observer"} />
		</Suspense>
	);
}
