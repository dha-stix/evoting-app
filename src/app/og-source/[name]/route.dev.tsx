import { loadPhoto, renderOg, type OgProps } from "@/lib/og";

export const runtime = "edge";

/**
 * Source designs for the static link-preview images in public/og (dev only). Run
 * `npm run render-og` (with `npm run dev` running) after changing them; it
 * saves small JPEGs that WhatsApp and other apps reliably show.
 */
const DESIGNS: Record<string, () => Promise<OgProps>> = {
	home: async () => ({
		photo: await loadPhoto(new URL("../../../../images/og/home.jpg", import.meta.url)),
		eyebrow: "Verified e-voting",
		title: "Every verified voice, counted live.",
		subtitle: "Register with your NIN and a live face scan, cast a secret ballot and watch results update in real time.",
	}),
	register: async () => ({
		photo: await loadPhoto(new URL("../../../../images/og/register.jpg", import.meta.url)),
		eyebrow: "Voter registration is open",
		title: "Register to vote in about 4 minutes.",
		subtitle: "Your NIN, your details and a guided live face scan. Your Voter ID Number arrives by email.",
	}),
	vote: async () => ({
		photo: await loadPhoto(new URL("../../../../images/og/vote.jpg", import.meta.url)),
		eyebrow: "Polls are open",
		title: "Your vote, verified and secret.",
		subtitle: "Sign in with your VIN, confirm the emailed code, pass a live face check and cast your ballot.",
	}),
	card: async () => ({
		photo: await loadPhoto(new URL("../../../../images/og/landscape.jpg", import.meta.url)),
		eyebrow: "Voter card",
		title: "Your voter card, any time.",
		subtitle: "Photo, VIN and a QR code officials can scan. Print front and back at ID-card size.",
		side: <SampleCard />,
	}),
};

/** A blank sample card: no real voter details ever appear in a preview. */
function SampleCard() {
	return (
		<div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 360, height: 227, padding: 22, borderRadius: 24, background: "#0A6B3D", color: "#fff", transform: "rotate(-4deg)", boxShadow: "0 30px 60px rgba(0,0,0,.45)", border: "2px solid rgba(255,255,255,.25)" }}>
			<div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600, letterSpacing: 2 }}>
				<div style={{ display: "flex" }}>AUTHVOTE</div>
				<div style={{ display: "flex", color: "#BBF7D0" }}>VOTER CARD</div>
			</div>
			<div style={{ display: "flex", gap: 18, alignItems: "center" }}>
				<div style={{ display: "flex", width: 78, height: 94, borderRadius: 12, background: "#CFE9D8" }} />
				<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
					<div style={{ display: "flex", width: 170, height: 16, borderRadius: 8, background: "rgba(255,255,255,.85)" }} />
					<div style={{ display: "flex", width: 140, height: 12, borderRadius: 6, background: "#BBF7D0" }} />
					<div style={{ display: "flex", width: 110, height: 12, borderRadius: 6, background: "rgba(255,255,255,.4)" }} />
				</div>
			</div>
			<div style={{ display: "flex", justifyContent: "flex-end", fontSize: 13, color: "#BBF7D0" }}>Ondo State</div>
		</div>
	);
}

export async function GET(_req: Request, { params }: { params: { name: string } }) {
	const design = DESIGNS[params.name];
	if (!design) return new Response("Not found", { status: 404 });
	return renderOg(await design());
}
