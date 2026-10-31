"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { IdCard, Printer, RotateCw } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useRef, useState } from "react";
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
	const print = useReactToPrint({ content: () => printRef.current, documentTitle: card ? `Voter card ${card.vin}` : "Voter card" });

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
						Not registered? <Link href="/register" className="font-semibold text-brand hover:underline">Register to vote</Link>
					</p>
				</form>
			</section>

			<section className="flex min-w-0 flex-[1.3_1_420px] flex-col items-center gap-6">
				<AnimatePresence mode="wait">
					{!card ? (
						<motion.div key="empty" exit={{ opacity: 0 }} className="flex aspect-[1.586] w-[min(100%,520px)] flex-col items-center justify-center gap-2.5 rounded-[26px] border-2 border-dashed border-[#CBD5CA] p-6 text-center text-subtle">
							<IdCard className="draw-in h-10 w-10" strokeWidth={1.6} aria-hidden />
							Your card will appear here
						</motion.div>
					) : (
						<motion.div key={card.vin} initial={{ opacity: 0, y: 40, rotate: -6, scale: 0.92 }} animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 22 }} className="flex w-full flex-col items-center gap-6">
							<div ref={printRef} className="w-[min(100%,520px)] [perspective:1400px] print:w-[86mm]">
								<div className={cn("relative aspect-[1.586] w-full transition-transform duration-700 [transform-style:preserve-3d] print:[transform:none]", flipped && "[transform:rotateY(180deg)]")}>
									<CardFront card={card} />
									<CardBack card={card} />
								</div>
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

const label = "text-[clamp(8px,1.4vw,10px)] tracking-[0.1em] text-[#BBF7D0]";
const value = "mt-0.5 font-semibold text-[clamp(11px,2vw,14px)]";

function CardFront({ card }: { card: VoterCard }) {
	return (
		<div className="guilloche absolute inset-0 flex flex-col justify-between overflow-hidden rounded-[26px] bg-brand p-[clamp(16px,4%,26px)] text-white shadow-[0_40px_70px_-40px_rgba(6,61,36,.8)] [backface-visibility:hidden] print:shadow-none">
			<div aria-hidden className="pointer-events-none absolute inset-0 animate-[shine_3.5s_ease-in-out_infinite] bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,.22)_50%,transparent_65%)] bg-[length:250%_100%]" />
			<div className="relative flex items-center justify-between gap-2">
				<span className="inline-flex items-center gap-2 font-display text-[clamp(13px,2.4vw,17px)] font-extrabold">
					<span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-white text-brand">
						<BallotMark className="h-4 w-4" />
					</span>
					AuthVote
				</span>
				<span className="text-[clamp(9px,1.6vw,11px)] font-bold tracking-[0.14em] text-[#BBF7D0]">VOTER IDENTIFICATION CARD</span>
			</div>
			<div className="relative flex items-center gap-[clamp(12px,3%,20px)]">
				<div className="relative flex aspect-[5/6] w-[26%] shrink-0 items-end justify-center overflow-hidden rounded-[14px] border-[3px] border-white/80 bg-brand-100">
					{card.photo_url ? (
						// Signed URL from private storage; next/image cannot cache it.
						// eslint-disable-next-line @next/next/no-img-element
						<img src={card.photo_url} alt={`Photo of ${card.first_name}`} className="absolute inset-0 h-full w-full object-cover" />
					) : (
						<Silhouette className="h-[90%] w-[90%]" tone="#7FB394" />
					)}
				</div>
				<dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-3.5 gap-y-[clamp(6px,1.6vw,12px)]">
					<div className="col-span-2">
						<dt className={label}>NAME</dt>
						<dd className="mt-0.5 truncate text-[clamp(13px,2.6vw,19px)] font-bold">
							{card.last_name.toUpperCase()}, {card.first_name} {card.middle_name ? `${card.middle_name[0]}.` : ""}
						</dd>
					</div>
					<div className="col-span-2">
						<dt className={label}>VIN</dt>
						<dd className="mt-0.5 font-mono text-[clamp(12px,2.4vw,17px)] font-bold tracking-[0.06em]">{card.vin}</dd>
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
			<div className="relative flex justify-between text-[clamp(9px,1.5vw,11px)] text-[#BBF7D0]">
				<span>Issued {formatDate(card.created_at)}</span>
				<span>{ELECTION_STATE} State</span>
			</div>
		</div>
	);
}

function CardBack({ card }: { card: VoterCard }) {
	return (
		<div className="absolute inset-0 flex items-center gap-5 overflow-hidden rounded-[26px] border border-line bg-white p-[clamp(16px,4%,26px)] shadow-[0_40px_70px_-40px_rgba(6,61,36,.6)] [backface-visibility:hidden] [transform:rotateY(180deg)] print:relative print:mt-4 print:[transform:none]">
			<div className="aspect-square w-[38%] shrink-0 rounded-xl border border-line bg-white p-2">
				<QRCodeSVG value={card.verify_url} className="h-full w-full" fgColor="#0D1B14" level="M" title="Card verification QR code" />
			</div>
			<div className="flex min-w-0 flex-col gap-2">
				<b className="font-display text-[clamp(15px,2.6vw,20px)]">Scan to verify</b>
				<span className="text-[clamp(11px,1.9vw,14px)] leading-snug text-muted">Officials scan this code to confirm the card is genuine and see the holder&apos;s photo.</span>
				<span className="truncate font-mono text-[clamp(10px,1.7vw,12px)] text-brand">{card.vin}</span>
			</div>
		</div>
	);
}
