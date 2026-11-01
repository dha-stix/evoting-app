import type { Metadata } from "next";
import { Suspense } from "react";
import { SetPasswordForm } from "@/components/admin/SetPasswordForm";
import { Logo } from "@/components/ui/Brand";
import { pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta({ title: "Set your password", path: "/admin/login", noindex: true, description: "Set up your AuthVote admin account." });

export default function SetPasswordPage() {
	return (
		<main className="grid-bg flex min-h-screen items-center justify-center px-4 py-12">
			<div className="card flex w-full max-w-[440px] flex-col gap-8 p-8 shadow-card">
				<Logo />
				<Suspense>
					<SetPasswordForm />
				</Suspense>
			</div>
		</main>
	);
}
