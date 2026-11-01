import type { Metadata } from "next";
import { Suspense } from "react";
import { SetPasswordForm } from "@/components/admin/SetPasswordForm";
import { Logo } from "@/components/ui/Brand";

export const metadata: Metadata = { title: "Set your password", robots: { index: false } };

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
