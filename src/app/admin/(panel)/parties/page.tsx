import { PartiesManager } from "@/components/admin/PartiesManager";
import { getPartiesWithCounts } from "@/lib/queries";
import { getCurrentAdmin } from "@/lib/supabase";

export const metadata = { title: "Parties" };

export default async function AdminPartiesPage() {
	const [admin, parties] = await Promise.all([getCurrentAdmin(), getPartiesWithCounts()]);
	return <PartiesManager parties={parties} canManage={admin?.role !== "observer"} />;
}
