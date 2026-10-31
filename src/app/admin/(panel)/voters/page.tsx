import { VotersTable } from "@/components/admin/VotersTable";
import { getVoters } from "@/lib/queries";
import { getCurrentAdmin } from "@/lib/supabase";

export const metadata = { title: "Voters" };

export default async function AdminVotersPage({ searchParams }: { searchParams: { q?: string; lga?: string; status?: string; page?: string } }) {
	const filters = { q: searchParams.q, lga: searchParams.lga, status: searchParams.status };
	const [admin, result] = await Promise.all([getCurrentAdmin(), getVoters({ ...filters, page: Number(searchParams.page) || 1 })]);
	return <VotersTable {...result} filters={filters} canManage={admin?.role !== "observer"} />;
}
