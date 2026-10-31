import {
	ArrowRight,
	BarChart3,
	Check,
	Eye,
	EyeOff,
	IdCard,
	Laptop,
	ListChecks,
	Lock,
	Mail,
	ScanFace,
	ShieldCheck,
	Smartphone,
	Tablet,
	Ticket,
	UserCheck,
	type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { IconTile, Reveal } from "@/components/ui/Bits";

const MARQUEE: [LucideIcon, string][] = [
	[IdCard, "NIN-linked registration"],
	[ScanFace, "Live face liveness"],
	[Mail, "Email one-time code"],
	[Ticket, "Single-use ballot"],
	[Lock, "Private photo storage"],
	[ShieldCheck, "Row-level security"],
	[ListChecks, "Full admin audit log"],
	[Smartphone, "Works on any phone"],
];

export function TrustMarquee() {
	return (
		<section aria-label="Security features" className="overflow-hidden border-b border-line bg-white py-[18px]">
			<div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
				{[...MARQUEE, ...MARQUEE].map(([Icon, label], i) => (
					<span key={i} aria-hidden={i >= MARQUEE.length} className="inline-flex items-center gap-2.5 whitespace-nowrap px-7 text-[15px] font-semibold text-[#26362D]">
						<span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand">
							<Icon className="h-[19px] w-[19px]" aria-hidden />
						</span>
						{label}
					</span>
				))}
			</div>
		</section>
	);
}

const STEPS = [
	{ icon: IdCard, title: "Register", body: "Enter your details and NIN, then take a guided live selfie. Your Voter ID Number arrives by email.", needs: ["NIN", "Email", "Camera"] },
	{ icon: ScanFace, title: "Verify", body: "Sign in with your VIN, NIN and date of birth, confirm the code we email you, then pass a quick live face check.", needs: ["VIN", "Email code", "Your face"] },
	{ icon: null, title: "Vote & track", body: "Pick your candidates, confirm, and get a receipt code. Results update live for everyone the moment your vote lands.", needs: ["Receipt code", "Live results"] },
];

export function HowItWorks() {
	return (
		<section id="how" className="container-page scroll-mt-20 py-24">
			<Reveal className="mb-12 flex max-w-[640px] flex-col gap-3">
				<span className="eyebrow">How it works</span>
				<h2 className="h-display text-[clamp(32px,4vw,48px)] leading-[1.05]">Three steps from citizen to counted.</h2>
			</Reveal>
			<div className="grid gap-5 md:grid-cols-3">
				{STEPS.map((s, i) => (
					<Reveal key={s.title} delay={i * 0.1} className="h-full">
						<article className="card lift flex h-full flex-col gap-4 p-8">
							<span className="font-mono text-sm font-bold text-brand">0{i + 1}</span>
							<IconTile>
								{s.icon ? (
									<s.icon className="draw-in h-[26px] w-[26px]" strokeWidth={1.8} aria-hidden />
								) : (
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[26px] w-[26px]" aria-hidden>
										<path d="M3 13h18v8H3z" />
										<path d="M8 13h8" />
										<g className="animate-drop">
											<path d="M8 3h8v9H8z" />
											<path d="M10 7.5l1.4 1.4L14 6.3" />
										</g>
									</svg>
								)}
							</IconTile>
							<h3 className="h-display text-2xl">{s.title}</h3>
							<p className="leading-relaxed text-muted">{s.body}</p>
							<div className="mt-auto flex flex-wrap gap-1.5 pt-2">
								{s.needs.map((n) => (
									<span key={n} className="inline-flex h-[30px] items-center gap-1.5 rounded-full border border-line bg-ground px-2.5 text-[13px] font-semibold text-muted">
										<Check className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden />
										{n}
									</span>
								))}
							</div>
						</article>
					</Reveal>
				))}
			</div>
		</section>
	);
}

const SECURITY: [LucideIcon, string, string][] = [
	[Eye, "Active liveness challenge", "Random head-turn prompts plus an anti-spoof model stop printed photos, screens and replayed video."],
	[ScanFace, "1:1 face match", "Your live face is compared only with the face you enrolled, using the ArcFace recognition model."],
	[Mail, "Email one-time code", "A short-lived code to your registered email proves you still control it before you reach the ballot."],
	[Ticket, "One ballot per person", "The database refuses a second vote from the same voter in the same election, even under heavy load."],
	[EyeOff, "Secret ballot", "We record that you voted, and separately what was voted. The two are never linked."],
	[ShieldCheck, "Locked-down data", "Row-level security, private photo storage, hashed NINs and an audit log of every admin action."],
];

export function SecurityGrid() {
	return (
		<section className="bg-forest text-white">
			<div className="container-page flex flex-col gap-12 py-24">
				<Reveal className="flex flex-wrap items-end justify-between gap-6">
					<div className="flex max-w-[620px] flex-col gap-3">
						<span className="eyebrow text-[#86EFAC]">Security</span>
						<h2 className="h-display text-[clamp(32px,4vw,48px)] leading-[1.05]">Built so a photo cannot vote.</h2>
					</div>
					<p className="max-w-[420px] leading-relaxed text-[#C9E7D3]">Every check runs on the server. The browser only guides you; it never decides who you are.</p>
				</Reveal>
				<div className="grid gap-px overflow-hidden rounded-3xl border border-[#1C5A3B] bg-[#1C5A3B] sm:grid-cols-2 lg:grid-cols-3">
					{SECURITY.map(([Icon, title, body]) => (
						<div key={title} className="group flex flex-col gap-3 bg-forest p-8 transition-colors hover:bg-[#08482b]">
							<Icon className="draw-in h-7 w-7 text-[#86EFAC] transition-transform group-hover:scale-110" strokeWidth={1.8} aria-hidden />
							<h3 className="text-[19px] font-semibold">{title}</h3>
							<p className="leading-relaxed text-[#C9E7D3]">{body}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

export function CardTeaser() {
	return (
		<Reveal className="h-full">
			<article className="flex h-full flex-col gap-5 overflow-hidden rounded-[28px] bg-brand-50 p-9">
				<h3 className="h-display text-[30px] tracking-[-0.02em]">Your voter card, any time</h3>
				<p className="max-w-[420px] leading-relaxed text-[#2F4A3B]">Download or print a card with a QR code officials can scan to confirm it is genuine.</p>
				<div className="lift guilloche flex aspect-[1.586] w-[min(100%,360px)] -rotate-3 flex-col justify-between self-center rounded-[20px] bg-brand p-5 text-white">
					<div className="flex justify-between text-[11px] font-bold tracking-[0.1em]">
						<span>AUTHVOTE</span>
						<span>VOTER CARD</span>
					</div>
					<div className="flex items-center gap-3.5">
						<div className="h-[76px] w-16 rounded-[10px] bg-brand-100" />
						<div className="flex flex-col gap-1">
							<b>OKAFOR, Adaeze N.</b>
							<span className="font-mono text-[13px] text-[#BBF7D0]">VIN 7K2M-9QXA-4T8P</span>
							<span className="text-xs text-[#C9E7D3]">Akure South · Ondo</span>
						</div>
					</div>
				</div>
				<ButtonLink href="/card" className="self-start">
					<IdCard className="h-5 w-5" aria-hidden /> Get my voter card
				</ButtonLink>
			</article>
		</Reveal>
	);
}

export function DeviceBanner() {
	return (
		<section className="container-page pb-24">
			<Reveal>
				<div className="guilloche relative flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-[32px] bg-forest p-[clamp(28px,5vw,56px)] text-white">
					<div className="flex flex-[1_1_380px] flex-col gap-4">
						<h2 className="h-display text-[clamp(30px,3.8vw,44px)] font-extrabold leading-[1.05]">Vote from any device with a camera.</h2>
						<p className="max-w-[460px] leading-relaxed text-[#C9E7D3]">Phone, tablet or laptop. No app to install, and it works on slow connections.</p>
						<div className="mt-2 flex flex-wrap gap-3">
							<ButtonLink href="/register" variant="light" lift>
								<UserCheck className="h-5 w-5" aria-hidden /> Register now
							</ButtonLink>
							<ButtonLink href="/results" variant="outlineLight">
								<BarChart3 className="h-5 w-5" aria-hidden /> See live results
							</ButtonLink>
						</div>
					</div>
					<div aria-hidden className="flex items-end gap-3.5">
						{[
							[Smartphone, "h-16 w-16 animate-float"],
							[Tablet, "h-20 w-20 animate-float-slow"],
							[Laptop, "h-16 w-16 animate-float"],
						].map(([Icon, cls], i) => {
							const I = Icon as LucideIcon;
							return (
								<span key={i} className={`inline-flex items-center justify-center rounded-[20px] bg-white/10 text-[#BBF7D0] ${cls as string}`}>
									<I className="h-[30px] w-[30px]" strokeWidth={1.6} />
								</span>
							);
						})}
					</div>
				</div>
			</Reveal>
		</section>
	);
}

export function ResultsLink() {
	return (
		<Link href="/results" className="inline-flex items-center gap-2 self-start font-semibold text-brand hover:underline">
			Open live results <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
		</Link>
	);
}
