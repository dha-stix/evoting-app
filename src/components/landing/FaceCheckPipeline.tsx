"use client";
import { Camera, Eye, ScanFace, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { LiveDot, Reveal } from "@/components/ui/Bits";
import { cn } from "@/lib/utils";

const STEPS = [
	{ icon: Camera, title: "Capture", body: "The camera guides you to fill the circle and checks the light.", where: "On your device" },
	{ icon: Eye, title: "Prove you are live", body: "A random head-turn prompt, plus a check for screens and printed photos.", where: "Server" },
	{ icon: ScanFace, title: "Match your face", body: "Your face template is compared with the one you enrolled. It must pass the threshold.", where: "Server" },
	{ icon: Ticket, title: "Ballot unlocked", body: "You can vote once in each open election. The database refuses a second ballot.", where: "Database" },
];

export function FaceCheckPipeline() {
	const [step, setStep] = useState(0);
	useEffect(() => {
		const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 1800);
		return () => clearInterval(id);
	}, []);

	return (
		<section className="container-page flex flex-col gap-10 pt-24">
			<Reveal className="flex flex-wrap items-end justify-between gap-5">
				<div className="flex max-w-[620px] flex-col gap-3">
					<span className="eyebrow">Inside the face check</span>
					<h2 className="h-display text-[clamp(32px,4vw,48px)] leading-[1.05]">Four checks, a few seconds.</h2>
				</div>
				<span className="inline-flex items-center gap-2 text-sm text-muted">
					<LiveDot /> Step {step + 1} of 4
				</span>
			</Reveal>
			<div className="h-1.5 overflow-hidden rounded-md bg-line">
				<div className="h-full rounded-md bg-brand transition-[width] duration-700 ease-out" style={{ width: `${(step + 1) * 25}%` }} />
			</div>
			<ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{STEPS.map(({ icon: Icon, title, body, where }, i) => {
					const on = i === step;
					const done = i < step;
					return (
						<li key={title} className={cn("flex flex-col gap-3.5 rounded-3xl border bg-white p-6 transition-all duration-500", on ? "-translate-y-1 border-brand shadow-lift" : "border-line")}>
							<div className="flex items-center justify-between">
								<span className={cn("inline-flex h-14 w-14 items-center justify-center rounded-[18px] transition-colors duration-500", on ? "animate-live bg-brand text-white" : done ? "bg-brand-100 text-forest" : "bg-brand-50 text-brand")}>
									<Icon className="h-7 w-7" strokeWidth={1.8} aria-hidden />
								</span>
								<span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", where === "On your device" ? "bg-[#EFF4FF] text-[#1D4ED8]" : "bg-[#F0F3EF] text-muted")}>{where}</span>
							</div>
							<h3 className="h-display text-[21px]">{title}</h3>
							<p className="text-[15px] leading-relaxed text-muted">{body}</p>
						</li>
					);
				})}
			</ol>
		</section>
	);
}
