import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminShell";
import { ActivityFeed, LiveElectionCard, OverviewStats, RegistrationsChart } from "@/components/admin/OverviewWidgets";
import { ButtonLink } from "@/components/ui/Button";
import { getOverview } from "@/lib/queries";
import { getCurrentAdmin } from "@/lib/supabase";

export const metadata = { title: "Overview" };

function greeting() {
	const h = Number(new Intl.DateTimeFormat("en-NG", { hour: "numeric", hour12: false, timeZone: "Africa/Lagos" }).format(new Date()));
	return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function AdminOverviewPage() {
	const [admin, { overview, elections, audit }] = await Promise.all([getCurrentAdmin(), getOverview()]);
	const live = elections.find((e) => e.status === "live");
	const today = new Intl.DateTimeFormat("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" }).format(new Date());

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title={`${greeting()}, ${admin?.full_name.split(" ")[0] ?? "admin"}`}
				sub={today}
				actions={
					admin?.role !== "observer" && (
						<ButtonLink href="/admin/elections?new=1" size="sm" className="h-11" lift>
							<Plus className="h-[18px] w-[18px]" aria-hidden /> New election
						</ButtonLink>
					)
				}
			/>
			<OverviewStats overview={overview} elections={elections} />
			<div className="flex flex-wrap gap-5">
				<LiveElectionCard election={live} voted={live ? overview.participation[String(live.id)] ?? 0 : 0} />
				<RegistrationsChart data={overview.registrations} />
			</div>
			<ActivityFeed entries={audit} />
		</div>
	);
}
