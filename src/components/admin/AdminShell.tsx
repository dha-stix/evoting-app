"use client";
import { BarChart3, Flag, LayoutGrid, LogOut, Menu, ShieldCheck, UserRound, Users, Vote, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Brand";
import { Drawer } from "@/components/ui/Overlay";
import { ADMIN_ROLE_LABEL } from "@/lib/constants";
import { signOutAdmin } from "@/lib/supabase-actions";
import { cn, initials } from "@/lib/utils";
import type { Admin } from "@/types";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
	{ href: "/admin", label: "Overview", icon: LayoutGrid },
	{ href: "/admin/elections", label: "Elections", icon: Vote },
	{ href: "/admin/candidates", label: "Candidates", icon: UserRound },
	{ href: "/admin/parties", label: "Parties", icon: Flag },
	{ href: "/admin/voters", label: "Voters", icon: Users },
	{ href: "/admin/team", label: "Admins & audit", icon: ShieldCheck },
	{ href: "/results", label: "Live results", icon: BarChart3 },
];

function NavLinks({ pathname, stagger }: { pathname: string; stagger?: boolean }) {
	return (
		<nav aria-label="Admin" className="flex flex-col gap-1">
			{NAV.map(({ href, label, icon: Icon }, i) => {
				const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
				return (
					<Link
						key={href}
						href={href}
						aria-current={active ? "page" : undefined}
						className={cn("flex min-h-[46px] items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition-colors", active ? "bg-white text-forest" : "text-[#C9E7D3] hover:bg-white/10 hover:text-white", stagger && "animate-rise")}
						style={stagger ? { animationDelay: `${0.05 + i * 0.04}s` } : undefined}
					>
						<Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} aria-hidden />
						{label}
					</Link>
				);
			})}
		</nav>
	);
}

function Profile({ admin }: { admin: Admin }) {
	return (
		<div className="mt-auto flex items-center gap-2.5 rounded-2xl bg-white/[0.07] p-3">
			<span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[13px] font-bold text-forest">{initials(admin.full_name)}</span>
			<span className="flex min-w-0 flex-1 flex-col">
				<b className="truncate text-sm">{admin.full_name}</b>
				<span className="text-xs text-[#9CC7AE]">{ADMIN_ROLE_LABEL[admin.role]}</span>
			</span>
			<form action={signOutAdmin}>
				<button type="submit" aria-label="Sign out" className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-[#C9E7D3] hover:bg-white/10 hover:text-white">
					<LogOut className="h-5 w-5" />
				</button>
			</form>
		</div>
	);
}

export function AdminShell({ admin, children }: { admin: Admin; children: React.ReactNode }) {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	useEffect(() => {
		setOpen(false);
	}, [pathname]);
	const current = NAV.find((n) => (n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href)));

	return (
		<div className="flex min-h-screen flex-col bg-ground md:flex-row">
			{/* Desktop: full-height sidebar */}
			<aside className="hidden w-[248px] shrink-0 bg-forest text-white md:block">
				<div className="sticky top-0 flex h-screen flex-col gap-7 overflow-y-auto px-3.5 py-6">
					<div className="px-2">
						<Logo href="/admin" tone="light" label="ADMIN" />
					</div>
					<NavLinks pathname={pathname} />
					<Profile admin={admin} />
				</div>
			</aside>

			{/* Phone and tablet: top bar with a hamburger */}
			<header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-forest px-4 text-white md:hidden">
				<Logo href="/admin" tone="light" />
				<span className="sr-only">{current?.label}</span>
				<button type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
					<Menu className="h-[22px] w-[22px]" />
				</button>
			</header>
			<Drawer open={open} onClose={() => setOpen(false)} title="Admin menu" side="left" width={320} className="bg-forest p-4 text-white">
				<div className="flex h-full flex-col gap-6">
					<div className="flex items-center justify-between pl-2">
						<Logo href="/admin" tone="light" label="ADMIN" />
						<button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
							<X className="h-5 w-5" />
						</button>
					</div>
					<NavLinks pathname={pathname} stagger />
					<Profile admin={admin} />
				</div>
			</Drawer>

			<main className="min-w-0 flex-1 p-[clamp(16px,3vw,36px)]">{children}</main>
		</div>
	);
}

export function PageHeader({ title, sub, icon: Icon, actions }: { title: string; sub?: React.ReactNode; icon?: LucideIcon; actions?: React.ReactNode }) {
	return (
		<header className="mb-6 flex flex-wrap items-center justify-between gap-4">
			<div className="flex items-center gap-4">
				{Icon && (
					<span className="hidden h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand sm:inline-flex">
						<Icon className="draw-in h-7 w-7" strokeWidth={1.8} aria-hidden />
					</span>
				)}
				<div>
					<h1 className="h-display text-[clamp(26px,3.4vw,38px)] font-extrabold">{title}</h1>
					{sub && <p className="mt-1 text-subtle">{sub}</p>}
				</div>
			</div>
			{actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
		</header>
	);
}
