"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { IdCard, Printer, RotateCw } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { forwardRef, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { BallotMark, Silhouette } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { DISTRICTS, ELECTION_STATE } from "@/lib/constants";
import { lookupVoterCard } from "@/lib/supabase-actions";
import { cn, formatDate } from "@/lib/utils";
import { cardLookupSchema } from "@/lib/validation";
import type { VoterCard } from "@/types";
import type { z } from "zod";

export function VoterCardFlow() {
	const [card, setCard] = useState<VoterCard | null>(null);
	const [flipped, setFlipped] = useState(false);
	const printRef = useRef<HTMLDivElement>(null);
	const form = useForm<z.input<typeof cardLookupSchema>>({ resolver: zodResolver(cardLookupSchema) });
	const print = useReactToPrint({
		content: () => printRef.current,
		documentTitle: card ? `Voter card ${card.vin}` : "Voter card",
		// Keep the card colours and lay it out on A4 with room to cut it out.
		pageStyle: "@page { size: A4 portrait; margin: 16mm; } html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff; }",
	});

	const onSubmit = form.handleSubmit(async (values) => {
		const res = await lookupVoterCard(values);
		if (!res.ok) return toast.error(res.error);
		setFlipped(false);
		setCard(res.data);
	});

	return (
		<div className="container-page flex flex-wrap items-center gap-10 py-12 pb-20">
			<section className="no-print flex flex-[1_1_340px] flex-col gap-5">
				<h1 className="h-display text-[clamp(32px,3.8vw,44px)] font-extrabold leading-[1.05]">Your voter card</h1>
				<p className="leading-relaxed text-muted">Enter your VIN and date of birth. Both are needed so nobody can print your card with your VIN alone.</p>
				<form onSubmit={onSubmit} noValidate className="card flex flex-col gap-[18px] p-6">
					<Field label="Voter ID Number (VIN)" error={form.formState.errors.vin?.message}>
						{(p) => <Input {...p} placeholder="XXXX-XXXX-XXXX" autoComplete="off" className="font-mono uppercase tracking-[0.08em]" {...form.register("vin")} />}
					</Field>
					<Field label="Date of birth" error={form.formState.errors.date_of_birth?.message}>
						{(p) => <Input {...p} type="date" {...form.register("date_of_birth")} />}
					</Field>
					<Button type="submit" size="lg" loading={form.formState.isSubmitting} lift>
						Show my card
					</Button>
					<p className="text-sm text-subtle">
						Not registered?{" "}
						<Link href="/register" className="font-semibold text-brand hover:underline">
							Register to vote
						</Link>
					</p>
				</form>
			</section>

			<section className="flex min-w-0 flex-[1.3_1_420px] flex-col items-center gap-6">
				<AnimatePresence mode="wait">
					{!card ? (
						<motion.div
							key="empty"
							exit={{ opacity: 0 }}
							className="flex aspect-[1.586] w-[min(100%,520px)] flex-col items-center justify-center gap-2.5 rounded-[26px] border-2 border-dashed border-[#CBD5CA] p-6 text-center text-subtle"
						>
							<IdCard className="draw-in h-10 w-10" strokeWidth={1.6} aria-hidden />
							Your card will appear here
						</motion.div>
					) : (
						<motion.div
							key={card.vin}
							initial={{ opacity: 0, y: 40, rotate: -6, scale: 0.92 }}
							animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
							transition={{ type: "spring", stiffness: 200, damping: 22 }}
							className="flex w-full flex-col items-center gap-6"
						>
							{/* On screen: one card that flips. */}
							<div className="w-[min(100%,520px)] [perspective:1400px]">
								<div className={cn("relative aspect-[1.586] w-full transition-transform duration-700 [transform-style:preserve-3d]", flipped && "[transform:rotateY(180deg)]")}>
									<CardFront card={card} className="absolute inset-0 [backface-visibility:hidden]" animated />
									<CardBack card={card} className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]" />
								</div>
							</div>
							{/* For printing: front and back one under the other at real ID-card size. */}
							<div className="hidden">
								<PrintSheet ref={printRef} card={card} />
							</div>
							<div className="no-print flex flex-wrap justify-center gap-2.5">
								<Button variant="secondary" onClick={() => setFlipped((f) => !f)}>
									<RotateCw className="h-[18px] w-[18px]" aria-hidden /> {flipped ? "Show front" : "Show back"}
								</Button>
								<Button onClick={() => print()} lift>
									<Printer className="h-[18px] w-[18px]" aria-hidden /> Print or save as PDF
								</Button>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</section>
		</div>
	);
}

// Sizes are in container units (cqw) so the card looks the same on a phone,
// a desktop screen and printed at 85.6 x 54 mm.
const label = "text-[1.9cqw] tracking-[0.1em] text-[#BBF7D0]";
const value = "mt-[0.3cqw] font-semibold text-[2.7cqw] leading-tight";
const cardBase = "relative h-full w-full overflow-hidden rounded-[5cqw] [print-color-adjust:exact] [-webkit-print-color-adjust:exact]";

/** The outer box is the size container that the cqw units inside measure against. */
function CardShell({ className, children }: { className?: string; children: React.ReactNode }) {
	return <div className={cn("aspect-[1.586] [container-type:inline-size]", className)}>{children}</div>;
}

function CardFront({ card, className, animated, flat }: { card: VoterCard; className?: string; animated?: boolean; flat?: boolean }) {
	return (
		<CardShell className={className}>
			<div className={cn(cardBase, "guilloche flex flex-col justify-between bg-brand p-[5cqw] text-white", !flat && "shadow-[0_40px_70px_-40px_rgba(6,61,36,.8)]")}>
				{animated && (
					<div
						aria-hidden
						className="pointer-events-none absolute inset-0 animate-[shine_3.5s_ease-in-out_infinite] bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,.22)_50%,transparent_65%)] bg-[length:250%_100%]"
					/>
				)}
				<div className="relative flex items-center justify-between gap-[2cqw]">
					<span className="inline-flex items-center gap-[1.6cqw] font-display text-[3.3cqw] font-extrabold">
						<span className="inline-flex h-[5cqw] w-[5cqw] items-center justify-center rounded-[1.5cqw] bg-white text-brand">
							<BallotMark className="h-[3.2cqw] w-[3.2cqw]" />
						</span>
						AuthVote
					</span>
					<span className="text-[2.1cqw] font-bold tracking-[0.14em] text-[#BBF7D0]">VOTER IDENTIFICATION CARD</span>
				</div>
				<div className="relative flex items-center gap-[3.8cqw]">
					<div className="relative flex aspect-[5/6] w-[26%] shrink-0 items-end justify-center overflow-hidden rounded-[2.7cqw] border-[0.6cqw] border-white/80 bg-brand-100">
						{card.photo_url ? (
							// Signed URL from private storage; next/image cannot cache it.
							// eslint-disable-next-line @next/next/no-img-element
							<img src={card.photo_url} alt={`Photo of ${card.first_name}`} className="absolute inset-0 h-full w-full object-cover" />
						) : (
							<Silhouette className="h-[90%] w-[90%]" tone="#7FB394" />
						)}
					</div>
					<dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-[2.7cqw] gap-y-[2cqw]">
						<div className="col-span-2">
							<dt className={label}>NAME</dt>
							<dd className="mt-[0.3cqw] truncate text-[3.6cqw] font-bold leading-tight">
								{card.last_name.toUpperCase()}, {card.first_name} {card.middle_name ? `${card.middle_name[0]}.` : ""}
							</dd>
						</div>
						<div className="col-span-2">
							<dt className={label}>VIN</dt>
							<dd className="mt-[0.3cqw] font-mono text-[3.2cqw] font-bold leading-tight tracking-[0.06em]">{card.vin}</dd>
						</div>
						<div>
							<dt className={label}>DATE OF BIRTH</dt>
							<dd className={value}>{formatDate(card.date_of_birth)}</dd>
						</div>
						<div>
							<dt className={label}>GENDER</dt>
							<dd className={cn(value, "capitalize")}>{card.gender}</dd>
						</div>
						<div>
							<dt className={label}>LGA</dt>
							<dd className={cn(value, "truncate")}>{card.home_lga}</dd>
						</div>
						<div>
							<dt className={label}>DISTRICT</dt>
							<dd className={value}>{DISTRICTS[card.district]}</dd>
						</div>
					</dl>
				</div>
				<div className="relative flex justify-between text-[2.1cqw] text-[#BBF7D0]">
					<span>Issued {formatDate(card.created_at)}</span>
					<span>{ELECTION_STATE} State</span>
				</div>
			</div>
		</CardShell>
	);
}

function CardBack({ card, className, flat }: { card: VoterCard; className?: string; flat?: boolean }) {
	return (
		<CardShell className={className}>
			<div className={cn(cardBase, "flex items-center gap-[3.8cqw] border border-line bg-white p-[5cqw] text-ink", !flat && "shadow-[0_40px_70px_-40px_rgba(6,61,36,.6)]")}>
				<div className="aspect-square w-[38%] shrink-0 rounded-[2.3cqw] border border-line bg-white p-[1.5cqw]">
					<QRCodeSVG value={card.verify_url} className="h-full w-full" fgColor="#0D1B14" level="M" title="Card verification QR code" />
				</div>
				<div className="flex min-w-0 flex-col gap-[1.5cqw]">
					<b className="font-display text-[3.8cqw] leading-tight">Scan to verify</b>
					<span className="text-[2.7cqw] leading-snug text-muted">Officials scan this code to confirm the card is genuine and see the holder&apos;s photo.</span>
					<span className="truncate font-mono text-[2.3cqw] text-brand">{card.vin}</span>
				</div>
			</div>
		</CardShell>
	);
}

/** What gets printed: both sides at ID-1 card size (85.6 x 54 mm) with a cutting guide. */
const PrintSheet = forwardRef<HTMLDivElement, { card: VoterCard }>(({ card }, ref) => (
	// Fills the printable area of an A4 page (297 mm minus 16 mm margins) so the cards sit in its centre.
	<div ref={ref} className="flex h-[264mm] w-full flex-col items-center justify-center gap-[8mm] bg-white p-0 font-sans text-ink">
		<p className="max-w-[120mm] text-center text-[9pt] text-subtle">AuthVote voter card · {card.vin} · Cut out the front and back along their dashed outlines, then laminate each one.</p>
		{(["Front", "Back"] as const).map((side) => (
			<div key={side} className="flex flex-col gap-[2mm]">
				<span className="text-[8pt] font-semibold uppercase tracking-[0.1em] text-subtle">{side}</span>
				<div className="w-[85.6mm] rounded-[3.4mm] outline-dashed outline-1 outline-offset-[1.5mm] outline-[#9CA3AF]">
					{side === "Front" ? <CardFront card={card} flat /> : <CardBack card={card} flat />}
				</div>
			</div>
		))}
	</div>
));
PrintSheet.displayName = "PrintSheet";
