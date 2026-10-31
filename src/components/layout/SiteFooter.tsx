import Link from "next/link";
import { Logo } from "@/components/ui/Brand";
import { CREDIT } from "@/lib/constants";

export function SiteFooter() {
	return (
		<footer className="no-print border-t border-line bg-white">
			<div className="container-page flex flex-wrap items-center justify-between gap-6 py-10 text-sm text-subtle">
				<Logo />
				<nav aria-label="Footer" className="flex flex-wrap gap-5">
					<Link href="/results" className="hover:text-brand">Live results</Link>
					<Link href="/card" className="hover:text-brand">Voter card</Link>
					<Link href="/register" className="hover:text-brand">Register</Link>
					<Link href="/admin/login" className="hover:text-brand">Admin sign-in</Link>
				</nav>
				<p>
					© {new Date().getFullYear()} AuthVote · Built by{" "}
					<a href={CREDIT.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">
						{CREDIT.name}
					</a>
				</p>
			</div>
		</footer>
	);
}
