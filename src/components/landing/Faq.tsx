"use client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronDown, EyeOff, ScanFace, UserCheck, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const FAQS: [LucideIcon, string, string][] = [
	[UserCheck, "Who can register?", "Any Nigerian citizen aged 18 or over with a valid 11-digit NIN, an email address and a home in one of Ondo State's 18 LGAs. You vote for governor, and for the senator of the district your LGA belongs to: Ondo North, Central or South. You only register once."],
	[ScanFace, "What happens to my face scan?", "We store one photo in private storage and a face template (a list of numbers, not a picture). They are used only to confirm it is you when you sign in to vote, and only election officers can view the photo."],
	[EyeOff, "Can anyone see who I voted for?", "No. Your ballot is stored without your identity. We only record that you have voted, so nobody can vote twice in your name."],
	[AlertTriangle, "The face check failed. What now?", "Move to even lighting, remove glasses or a face covering, and try again. After three failed attempts sign-in pauses for 30 minutes and an election officer can help."],
];

export function Faq() {
	const [open, setOpen] = useState(0);
	return (
		<section className="mx-auto max-w-[860px] px-4 pb-24 sm:px-6">
			<h2 className="h-display mb-7 text-[clamp(30px,3.6vw,42px)]">Questions, answered</h2>
			<div className="flex flex-col gap-3">
				{FAQS.map(([Icon, q, a], i) => {
					const isOpen = open === i;
					return (
						<div key={q} className="card overflow-hidden rounded-[18px]">
							<h3>
								<button type="button" aria-expanded={isOpen} aria-controls={`faq-${i}`} onClick={() => setOpen(isOpen ? -1 : i)} className="flex min-h-16 w-full items-center justify-between gap-4 px-5 py-4 text-left text-[17px] font-semibold">
									<span className="flex items-center gap-3.5">
										<span className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand">
											<Icon className="h-[19px] w-[19px]" aria-hidden />
										</span>
										{q}
									</span>
									<ChevronDown className={cn("h-5 w-5 shrink-0 transition-transform duration-300", isOpen && "rotate-180")} aria-hidden />
								</button>
							</h3>
							<AnimatePresence initial={false}>
								{isOpen && (
									<motion.div id={`faq-${i}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
										<p className="px-5 pb-5 pl-[74px] leading-relaxed text-muted">{a}</p>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					);
				})}
			</div>
		</section>
	);
}
