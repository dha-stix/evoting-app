import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/ui/Brand";

export const metadata: Metadata = { title: "Admin sign-in", robots: { index: false } };

export default function AdminLoginPage() {
	return (
		<div className="flex min-h-screen flex-wrap bg-ground">
			<aside className="relative hidden flex-[1_1_440px] flex-col justify-between overflow-hidden bg-forest p-12 text-white md:flex">
				<div aria-hidden className="absolute -bottom-[300px] -right-[300px] h-[760px] w-[760px] animate-[spin_18s_linear_infinite] rounded-full bg-[repeating-conic-gradient(rgba(255,255,255,.05)_0deg_6deg,transparent_6deg_12deg)]" />
				<div className="relative">
					<Logo tone="light" />
				</div>
				<div className="relative flex max-w-[460px] flex-col gap-4">
					<h2 className="h-display animate-rise text-[52px] font-extrabold leading-none tracking-[-0.035em]">Election control centre</h2>
					<p className="animate-rise text-lg leading-relaxed text-[#C9E7D3] [animation-delay:.1s]">Run elections, manage candidates and parties, and watch turnout as it happens. Every action here is logged.</p>
				</div>
				<span className="relative text-sm text-[#9CC7AE]">Authorised election officers only</span>
			</aside>
			<main className="flex flex-[1_1_440px] items-center justify-center px-4 py-12 sm:px-6">
				<div className="flex w-full max-w-[420px] flex-col gap-8">
					<div className="md:hidden">
						<Logo />
					</div>
					<Suspense>
						<LoginForm />
					</Suspense>
				</div>
			</main>
		</div>
	);
}
