import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentAdmin } from "@/lib/supabase";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · AuthVote admin" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const admin = await getCurrentAdmin();
	if (!admin) redirect("/admin/login?error=not-admin");
	return <AdminShell admin={admin}>{children}</AdminShell>;
}
