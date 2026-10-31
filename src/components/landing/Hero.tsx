import { ArrowRight, BarChart3, Check, EyeOff, ScanFace, UserCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { LiveDot } from "@/components/ui/Bits";

const CHIPS = [
	{ icon: ScanFace, label: "Liveness-checked face match" },
	{ icon: UserCheck, label: "One person, one vote" },
	{ icon: EyeOff, label: "Anonymous ballots" },
	{ icon: BarChart3, label: "Live results" },
];

export function Hero({ registrationOpen = true }: { registrationOpen?: boolean }) {
	return (
		<section className="grid-bg relative border-b border-line">
			<div className="container-page grid items-center gap-14 py-16 md:py-[88px] lg:grid-cols-[1.05fr_1fr]">
				<div className="flex flex-col gap-6">
					<span className="inline-flex animate-rise items-center gap-2.5 self-start rounded-full border border-[#D5DDD4] bg-white px-3.5 py-2 text-sm font-semibold text-brand">
						<LiveDot />
						{registrationOpen ? "Voter registration is open" : "Elections are live"}
					</span>
					<h1 className="h-display animate-rise text-[clamp(42px,6.2vw,76px)] font-extrabold leading-none [animation-delay:.1s]">
						Every verified voice, <span className="text-brand">counted live.</span>
					</h1>
					<p className="max-w-[540px] animate-rise text-[clamp(17px,1.6vw,20px)] leading-relaxed text-muted [animation-delay:.2s]">
						Register once with your NIN and a live face scan. On election day, prove it is really you in seconds, cast a secret ballot, and watch the results update as votes land.
					</p>
					<div className="flex animate-rise flex-wrap gap-3 [animation-delay:.3s]">
						<ButtonLink href="/register" size="lg" lift>
							Register to vote <ArrowRight className="h-5 w-5" aria-hidden />
						</ButtonLink>
						<ButtonLink href="/vote" size="lg" variant="secondary" lift>
							<ScanFace className="h-5 w-5" aria-hidden /> I am registered — vote
						</ButtonLink>
					</div>
					<ul className="mt-2 flex animate-rise flex-wrap gap-2.5 [animation-delay:.45s]">
						{CHIPS.map(({ icon: Icon, label }) => (
							<li key={label} className="inline-flex h-11 items-center gap-2.5 rounded-full border border-line bg-white py-0 pl-1.5 pr-4 text-sm font-semibold text-[#26362D]">
								<span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand">
									<Icon className="h-[17px] w-[17px]" aria-hidden />
								</span>
								{label}
							</li>
						))}
					</ul>
				</div>
				<PhoneMockup />
			</div>
		</section>
	);
}

function PhoneMockup() {
	return (
		<div className="relative flex animate-rise justify-center py-6 [animation-delay:.2s]" aria-hidden>
			<div className="absolute inset-x-[10%] inset-y-[8%] rounded-[40px] bg-brand-100/80" />
			<div className="relative h-[600px] w-[296px] rounded-[46px] bg-ink p-3 shadow-[0_40px_80px_-30px_rgba(6,61,36,.55)]">
				<div className="flex h-full w-full flex-col gap-4 overflow-hidden rounded-[36px] bg-white px-5 pb-5 pt-6">
					<div className="flex items-center justify-between">
						<span className="font-display text-[17px] font-bold">Face check</span>
						<span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand">Step 3 of 3</span>
					</div>
					<div className="relative flex h-[290px] items-center justify-center overflow-hidden rounded-3xl bg-[#0F2A1D]">
						<div className="flex h-[220px] w-[170px] items-end justify-center overflow-hidden rounded-[50%] border-[3px] border-dashed border-[#4ADE80]">
							<svg width="150" height="190" viewBox="0 0 150 190">
								<circle cx="75" cy="72" r="38" fill="#2F5A45" />
								<g className="origin-center animate-blink [transform-box:fill-box]">
									<circle cx="62" cy="70" r="3.5" fill="#BBF7D0" />
									<circle cx="88" cy="70" r="3.5" fill="#BBF7D0" />
								</g>
								<g fill="#4ADE80">
									<circle cx="56" cy="58" r="1.4" />
									<circle cx="94" cy="58" r="1.4" />
									<circle cx="75" cy="84" r="1.8" />
									<circle cx="64" cy="94" r="1.4" />
									<circle cx="86" cy="94" r="1.4" />
								</g>
								<path d="M10 190c4-48 30-72 65-72s61 24 65 72z" fill="#2F5A45" />
							</svg>
						</div>
						<div className="absolute left-[14%] right-[14%] h-[3px] animate-scan rounded bg-[#4ADE80] shadow-[0_0_18px_4px_rgba(74,222,128,.55)]" />
						<span className="absolute bottom-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/45 px-3 py-1.5 text-xs font-semibold text-white">Slowly turn your head left</span>
					</div>
					<div className="flex flex-col gap-2.5 text-[13px]">
						{["Face centred, good light", "Blink detected"].map((t) => (
							<div key={t} className="flex items-center gap-2.5">
								<span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-brand text-white">
									<Check className="h-3.5 w-3.5" strokeWidth={3} />
								</span>
								{t}
							</div>
						))}
						<div className="flex items-center gap-2.5 text-muted">
							<span className="h-[22px] w-[22px] animate-live rounded-full border-2 border-brand-500" />
							Head turn
						</div>
					</div>
					<div className="mt-auto flex h-12 items-center justify-center rounded-[14px] bg-brand-50 text-sm font-semibold text-brand">Hold still…</div>
				</div>
			</div>
			<div className="absolute left-0 top-[70px] hidden animate-float items-center gap-3 rounded-[18px] border border-line bg-white px-4 py-3.5 shadow-lift sm:flex">
				<svg width="56" height="56" viewBox="0 0 64 64">
					<circle cx="32" cy="32" r="28" fill="none" stroke="#E8F5EC" strokeWidth="7" />
					<circle cx="32" cy="32" r="28" fill="none" stroke="#0A6B3D" strokeWidth="7" strokeLinecap="round" strokeDasharray="176" transform="rotate(-90 32 32)" style={{ strokeDashoffset: 176, animation: "draw 2.4s cubic-bezier(.2,.7,.2,1) forwards .6s" }} />
				</svg>
				<div>
					<div className="text-xs text-subtle">Face match</div>
					<div className="font-display text-xl font-bold">Verified</div>
				</div>
			</div>
			<div className="absolute bottom-16 right-0 hidden w-[230px] animate-float-slow flex-col gap-2.5 rounded-[18px] border border-line bg-white p-4 shadow-lift sm:flex">
				<div className="flex items-center gap-2 text-xs font-bold text-brand">
					<LiveDot className="h-[7px] w-[7px]" /> LIVE RESULTS
				</div>
				{[
					["APC", 48, "#1D4ED8"],
					["PDP", 33, "#C1121F"],
					["LP", 19, "#15803D"],
				].map(([p, v, c]) => (
					<div key={p as string} className="text-xs">
						<div className="flex justify-between">
							<span>{p}</span>
							<b>{v}%</b>
						</div>
						<div className="h-1.5 rounded-md bg-[#EEF2ED]">
							<div className="h-full origin-left animate-grow rounded-md" style={{ width: `${v}%`, background: c as string }} />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
