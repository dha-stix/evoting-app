import { Faq } from "@/components/landing/Faq";
import { FaceCheckPipeline } from "@/components/landing/FaceCheckPipeline";
import { Hero } from "@/components/landing/Hero";
import { CardTeaser, DeviceBanner, HowItWorks, ResultsLink, SecurityGrid, TrustMarquee } from "@/components/landing/Sections";
import { LiveDot, Reveal } from "@/components/ui/Bits";
import { TallyBars, rankCandidates } from "@/components/results/TallyBars";
import { getPublicElections } from "@/lib/queries";
import { electionStatus } from "@/lib/utils";

export const revalidate = 30;

export default async function HomePage() {
	const elections = await getPublicElections().catch(() => []);
	const live = elections.find((e) => electionStatus(e) === "live");
	const featured = live ?? elections.find((e) => electionStatus(e) === "ended");
	const ranked = featured ? rankCandidates(featured.candidates, featured.tallies) : null;

	return (
		<>
			<Hero registrationOpen={!live} />
			<TrustMarquee />
			<HowItWorks />
			<SecurityGrid />
			<FaceCheckPipeline />
			<section className="container-page grid gap-6 py-24 lg:grid-cols-2">
				<Reveal className="h-full">
					<article className="card flex h-full flex-col gap-5 rounded-[28px] p-9">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<span className="inline-flex items-center gap-2 text-[13px] font-bold tracking-[0.06em] text-brand">
								{live && <LiveDot />}
								{live ? "LIVE NOW" : featured ? "LATEST RESULT" : "RESULTS"}
							</span>
							{featured && <span className="text-[13px] text-subtle">{featured.title}</span>}
						</div>
						<h3 className="h-display text-[30px] tracking-[-0.02em]">Watch the count as it happens</h3>
						{ranked && ranked.rows.length > 0 ? (
							<TallyBars rows={ranked.rows.slice(0, 3)} compact />
						) : (
							<p className="leading-relaxed text-muted">No election is running yet. When voting opens, the count appears here and updates live for everyone.</p>
						)}
						<div className="mt-auto">
							<ResultsLink />
						</div>
					</article>
				</Reveal>
				<CardTeaser />
			</section>
			<Faq />
			<DeviceBanner />
		</>
	);
}
