"use client";
import { BarChart3, ChevronRight, CircleHelp, IdCard, Menu, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Brand";
import { Drawer } from "@/components/ui/Overlay";
import { cn } from "@/lib/utils";

const LINKS = [
	{ href: "/#how", label: "How it works", icon: CircleHelp },
	{ href: "/results", label: "Live results", icon: BarChart3 },
	{ href: "/card", label: "Voter card", icon: IdCard },
];

export function SiteHeader() {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	useEffect(() => {
		setOpen(false);
	}, [pathname]);

	return (
		<>
			<header className="no-print sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-md">
				<div className="container-page flex h-[72px] items-center justify-between gap-4">
					<Logo />
					<nav aria-label="Main" className="hidden items-center gap-1.5 md:flex">
						{LINKS.map(({ href, label, icon: Icon }) => {
							const active = href !== "/#how" && pathname.startsWith(href);
							return (
								<Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("inline-flex h-10 items-center gap-2 rounded-[10px] px-3.5 text-[15px] font-semibold transition-colors", active ? "bg-brand-50 text-brand" : "text-muted hover:bg-ground hover:text-ink")}>
									<Icon className="h-[18px] w-[18px]" aria-hidden />
									{label}
								</Link>
							);
						})}
					</nav>
					<div className="hidden items-center gap-2.5 md:flex">
						<ButtonLink href="/register" variant="secondary" size="sm" className="h-11 px-4">
							Register
						</ButtonLink>
						<ButtonLink href="/vote" size="sm" className="h-11 px-4">
							Vote now
						</ButtonLink>
					</div>
					<button type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#CBD5CA] md:hidden">
						<Menu className="h-[22px] w-[22px]" />
					</button>
				</div>
			</header>

			{/* Phone and tablet: the menu slides in from the side. Rendered outside the
			    header because its backdrop blur would trap a fixed-position overlay. */}
			<Drawer open={open} onClose={() => setOpen(false)} title="Menu" width={340}>
				<div className="flex flex-1 flex-col gap-6">
					<nav aria-label="Main" className="flex flex-col gap-1.5">
						{LINKS.map(({ href, label, icon: Icon }, i) => {
							const active = href !== "/#how" && pathname.startsWith(href);
							return (
								<Link
									key={href}
									href={href}
									onClick={() => setOpen(false)}
									aria-current={active ? "page" : undefined}
									className={cn("flex min-h-[52px] animate-rise items-center gap-3 rounded-2xl px-3 font-semibold transition-colors", active ? "bg-brand-50 text-brand" : "hover:bg-ground")}
									style={{ animationDelay: `${0.08 + i * 0.05}s` }}
								>
									<span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand">
										<Icon className="h-5 w-5" aria-hidden />
									</span>
									<span className="flex-1">{label}</span>
									<ChevronRight className="h-[18px] w-[18px] text-subtle" aria-hidden />
								</Link>
							);
						})}
					</nav>
					<div className="mt-auto flex flex-col gap-2.5">
						<ButtonLink href="/vote" size="lg" onClick={() => setOpen(false)}>
							Vote now
						</ButtonLink>
						<ButtonLink href="/register" size="lg" variant="secondary" onClick={() => setOpen(false)}>
							Register to vote
						</ButtonLink>
						<Link href="/admin/login" onClick={() => setOpen(false)} className="mt-2 inline-flex items-center justify-center gap-2 text-sm font-semibold text-subtle hover:text-brand">
							<ShieldCheck className="h-4 w-4" aria-hidden /> Admin sign-in
						</Link>
					</div>
				</div>
			</Drawer>
		</>
	);
}
