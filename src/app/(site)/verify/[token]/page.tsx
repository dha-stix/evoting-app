import { BadgeCheck, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { Silhouette } from "@/components/ui/Brand";
import { DISTRICTS, STORAGE } from "@/lib/constants";
import { verifyCardToken } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase";
import { formatDate, fullName } from "@/lib/utils";

export const metadata: Metadata = { title: "Verify a voter card", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Landing page for the QR code on a voter card. */
export default async function VerifyCardPage({ params }: { params: { token: string } }) {
	const vin = await verifyCardToken(decodeURIComponent(params.token));
	const db = createServiceClient();
	const { data: voter } = vin
		? await db.from("voters").select("vin, first_name, middle_name, last_name, home_lga, district, status, created_at, photo_path").eq("vin", vin).maybeSingle()
		: { data: null };
	const photo = voter ? (await db.storage.from(STORAGE.voterPhotos).createSignedUrl(voter.photo_path, 120)).data?.signedUrl : null;
	const valid = voter && voter.status === "active";

	return (
		<div className="container-page py-16">
			<section className="card mx-auto flex max-w-[520px] flex-col items-center gap-5 p-8 text-center">
				{valid ? (
					<>
						<span className="inline-flex animate-pop items-center gap-2 rounded-full bg-brand-50 px-4 py-2 font-bold text-brand">
							<BadgeCheck className="h-5 w-5" aria-hidden /> Genuine voter card
						</span>
						<div className="relative flex h-40 w-32 items-end justify-center overflow-hidden rounded-2xl bg-brand-100">
							{photo ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img src={photo} alt={`Photo of ${voter.first_name}`} className="absolute inset-0 h-full w-full object-cover" />
							) : (
								<Silhouette className="h-[90%] w-[90%]" tone="#7FB394" />
							)}
						</div>
						<div>
							<h1 className="h-display text-2xl">{fullName(voter)}</h1>
							<p className="mt-1 font-mono text-muted">{voter.vin}</p>
							<p className="mt-1 text-muted">
								{voter.home_lga} · {DISTRICTS[voter.district as keyof typeof DISTRICTS]} · registered {formatDate(voter.created_at)}
							</p>
						</div>
					</>
				) : (
					<>
						<span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-danger-bg text-danger">
							<ShieldAlert className="h-8 w-8" aria-hidden />
						</span>
						<h1 className="h-display text-2xl">This card could not be verified</h1>
						<p className="text-muted">The code is invalid, or the voter record is suspended. Do not accept this card.</p>
					</>
				)}
			</section>
		</div>
	);
}
