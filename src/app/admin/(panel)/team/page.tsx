import { redirect } from "next/navigation";
import { TeamManager } from "@/components/admin/TeamManager";
import { getTeam } from "@/lib/queries";
import { getCurrentAdmin } from "@/lib/supabase";

export const metadata = { title: "Admins & audit log" };

export default async function AdminTeamPage() {
	const [me, team] = await Promise.all([getCurrentAdmin(), getTeam()]);
	if (!me) redirect("/admin/login");
	return <TeamManager me={me} admins={team.admins} audit={team.audit} />;
}
