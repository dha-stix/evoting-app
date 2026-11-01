"use client";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ElectionStatus } from "@/types";

/** Big success tick that springs in and draws its stroke. */
export function AnimatedCheck({ size = 92, className }: { size?: number; className?: string }) {
	return (
		<div className={cn("inline-flex animate-pop items-center justify-center rounded-full bg-brand-500 text-white shadow-[0_0_0_14px_#E8F5EC]", className)} style={{ width: size, height: size }}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="tick" style={{ width: size / 2, height: size / 2 }} aria-hidden>
				<path d="M5 12.5l4.5 4.5L19 7.5" />
			</svg>
		</div>
	);
}

export function LiveDot({ className }: { className?: string }) {
	return <span className={cn("inline-block h-2 w-2 animate-live rounded-full bg-brand-500", className)} aria-hidden />;
}

const STATUS_STYLE: Record<ElectionStatus, string> = {
	live: "bg-brand-50 text-brand",
	scheduled: "bg-[#EFF4FF] text-[#1D4ED8]",
	ended: "bg-[#F0F3EF] text-muted",
	draft: "bg-warn-bg text-warn",
};

export function StatusPill({ status }: { status: ElectionStatus }) {
	return (
		<span className={cn("inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-bold capitalize", STATUS_STYLE[status])}>
			{status === "live" && <LiveDot className="h-[7px] w-[7px]" />}
			{status}
		</span>
	);
}

export function Pill({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "amber" | "grey" | "red" | "dark" }) {
	const tones = { green: "bg-brand-50 text-brand", amber: "bg-warn-bg text-warn", grey: "bg-[#F0F3EF] text-muted", red: "bg-danger-bg text-danger", dark: "bg-forest text-white" };
	return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold", tones[tone])}>{children}</span>;
}

/** Two or more mutually exclusive options shown as a pill switch. */
export function Segmented<T extends string>({ value, onChange, options, label, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode }[]; label: string; className?: string }) {
	return (
		<div role="radiogroup" aria-label={label} className={cn("inline-grid gap-1.5 rounded-[14px] bg-[#E9EEE8] p-1", className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(max-content, 1fr))` }}>
			{options.map((o) => {
				const on = o.value === value;
				return (
					<button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)} className={cn("relative h-11 whitespace-nowrap rounded-[10px] px-4 text-[15px] font-semibold transition-colors", on ? "text-ink" : "text-subtle hover:text-ink")}>
						{on && <motion.span layoutId={`seg-${label}`} className="absolute inset-0 rounded-[10px] bg-white shadow-[0_4px_12px_-6px_rgba(0,0,0,.25)]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
						<span className="relative">{o.label}</span>
					</button>
				);
			})}
		</div>
	);
}

export function CopyButton({ text, className }: { text: string; className?: string }) {
	const [copied, setCopied] = useState(false);
	return (
		<button
			type="button"
			onClick={async () => {
				await navigator.clipboard.writeText(text);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			}}
			className={cn("inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-3.5 font-semibold text-white", className)}
		>
			{copied ? <Check className="h-[18px] w-[18px]" /> : <Copy className="h-[18px] w-[18px]" />}
			<span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
		</button>
	);
}

/**
 * One real input drawn as six boxes, so fast typing, paste and one-time-code
 * autofill all land in the right place.
 */
export function OtpInput({ value, onChange, invalid, disabled }: { value: string; onChange: (v: string) => void; invalid?: boolean; disabled?: boolean }) {
	const [focused, setFocused] = useState(false);
	const active = Math.min(value.length, 5);
	return (
		<div className="relative">
			<input
				aria-label="One-time code"
				inputMode="numeric"
				autoComplete="one-time-code"
				pattern="[0-9]*"
				maxLength={6}
				value={value}
				disabled={disabled}
				aria-invalid={invalid}
				onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
			/>
			<div aria-hidden className="grid grid-cols-6 gap-2">
				{Array.from({ length: 6 }, (_, i) => (
					<div
						key={i}
						className={cn(
							"flex h-[60px] items-center justify-center rounded-xl border bg-white font-mono text-[26px] font-bold transition-[border-color,box-shadow]",
							invalid ? "border-danger" : "border-[#D5DDD4]",
							focused && i === active && "border-brand ring-4 ring-brand/10",
							disabled && "bg-ground",
						)}
					>
						{value[i] ?? (focused && i === active ? <span className="h-7 w-0.5 animate-pulse bg-brand" /> : "")}
					</div>
				))}
			</div>
		</div>
	);
}

/** Fades content up the first time it scrolls into view. */
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
	return (
		<motion.div className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay, ease: [0.2, 0.7, 0.2, 1] }}>
			{children}
		</motion.div>
	);
}

export function IconTile({ children, className }: { children: React.ReactNode; className?: string }) {
	return <span className={cn("inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand", className)}>{children}</span>;
}
