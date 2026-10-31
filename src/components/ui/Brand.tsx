import Image from "next/image";
import Link from "next/link";
import { STORAGE, SITE_NAME } from "@/lib/constants";
import { cn, publicStorageUrl } from "@/lib/utils";
import type { Party } from "@/types";

export function BallotMark({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
			<path d="M4 13h16v7H4z" />
			<path d="M7 13V5h10v8" />
			<path d="M10 9l1.5 1.5L14 8" />
		</svg>
	);
}

export function Logo({ href = "/", tone = "dark", label }: { href?: string; tone?: "dark" | "light"; label?: string }) {
	return (
		<Link href={href} className={cn("inline-flex items-center gap-2.5 font-display text-[21px] font-extrabold tracking-[-0.02em]", tone === "dark" ? "text-ink" : "text-white")}>
			<span className={cn("inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px]", tone === "dark" ? "bg-brand text-white" : "bg-white text-brand")}>
				<BallotMark className="h-5 w-5" />
			</span>
			<span>
				{SITE_NAME}
				{label && <span className="block font-sans text-xs font-semibold tracking-[0.06em] text-brand-300">{label}</span>}
			</span>
		</Link>
	);
}

/** Official logo when uploaded, otherwise a badge in the party colour. */
export function PartyBadge({ party, size = 48, className }: { party: Pick<Party, "acronym" | "color" | "logo_path" | "name">; size?: number; className?: string }) {
	const logo = publicStorageUrl(STORAGE.partyLogos, party.logo_path);
	if (logo) {
		return (
			<span className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-line", className)} style={{ width: size, height: size }}>
				<Image src={logo} alt={`${party.name} logo`} width={size} height={size} className="h-full w-full object-contain p-1" />
			</span>
		);
	}
	return (
		<span
			role="img"
			aria-label={`${party.name} (${party.acronym})`}
			className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-extrabold tracking-wide text-white", className)}
			style={{ width: size, height: size, background: party.color, fontSize: Math.max(10, Math.round(size / (party.acronym.length > 3 ? 4.2 : 3.4))) }}
		>
			{party.acronym}
		</span>
	);
}

/** Neutral portrait placeholder used when a photo is missing. */
export function Silhouette({ className, tone = "#C5D3C9" }: { className?: string; tone?: string }) {
	return (
		<svg viewBox="0 0 150 190" aria-hidden className={className}>
			<circle cx="75" cy="72" r="38" fill={tone} />
			<path d="M10 190c4-48 30-72 65-72s61 24 65 72z" fill={tone} />
		</svg>
	);
}
