import { BallotMark } from "@/components/ui/Brand";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
	return (
		<main className="grid-bg flex min-h-screen flex-col items-center justify-center gap-5 px-4 text-center">
			<span className="inline-flex h-16 w-16 animate-pop items-center justify-center rounded-2xl bg-brand text-white">
				<BallotMark className="h-8 w-8" />
			</span>
			<h1 className="h-display text-4xl font-extrabold">Page not found</h1>
			<p className="max-w-[420px] text-muted">The page you are looking for does not exist or has moved.</p>
			<div className="flex flex-wrap justify-center gap-3">
				<ButtonLink href="/">Go home</ButtonLink>
				<ButtonLink href="/results" variant="secondary">Live results</ButtonLink>
			</div>
		</main>
	);
}
