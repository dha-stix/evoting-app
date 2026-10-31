import { clsx, type ClassValue } from "clsx";
import type { Election, ElectionStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
	return clsx(inputs);
}

export function electionStatus(e: Pick<Election, "is_draft" | "starts_at" | "ends_at">, now = Date.now()): ElectionStatus {
	if (e.is_draft) return "draft";
	if (now < new Date(e.starts_at).getTime()) return "scheduled";
	if (now < new Date(e.ends_at).getTime()) return "live";
	return "ended";
}

const dateFmt = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const numberFmt = new Intl.NumberFormat("en-NG");

export const formatDate = (d: string | Date) => dateFmt.format(new Date(d));
export const formatDateTime = (d: string | Date) => dateTimeFmt.format(new Date(d));
export const formatNumber = (n: number) => numberFmt.format(n);
export const percent = (part: number, whole: number, digits = 1) =>
	whole > 0 ? `${((part / whole) * 100).toFixed(digits)}%` : "0%";

export function timeAgo(d: string | Date) {
	const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
	if (s < 60) return "just now";
	if (s < 3600) return `${Math.floor(s / 60)}m ago`;
	if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
	return formatDate(d);
}

export function countdown(ms: number) {
	if (ms <= 0) return "0:00";
	const total = Math.floor(ms / 1000);
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	return h > 0 ? `${h}h ${m}m` : `${m}:${String(s).padStart(2, "0")}`;
}

export const initials = (name: string) =>
	name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((w) => w[0]!.toUpperCase())
		.join("");

export const maskEmail = (email: string) => {
	const [user, domain] = email.split("@");
	return `${user![0]}•••@${domain}`;
};

export const fullName = (v: { first_name: string; middle_name?: string | null; last_name: string }) =>
	[v.first_name, v.middle_name, v.last_name].filter(Boolean).join(" ");

export function publicStorageUrl(bucket: string, path: string | null) {
	if (!path) return null;
	return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
