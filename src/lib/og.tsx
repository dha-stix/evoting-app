import { ImageResponse } from "next/og";

/** Shared design for link-preview images (1200 x 630, the size every platform accepts). */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = "image/png";

const C = { forest: "#063D24", brand: "#0A6B3D", mint: "#86EFAC", pale: "#C9E7D3", line: "#1C5A3B", white: "#FFFFFF" };

async function fonts() {
	// Paths must be literal so the bundler ships the font files with the route.
	const load = (url: URL) => fetch(url).then((r) => r.arrayBuffer());
	const [display, regular, semibold] = await Promise.all([
		load(new URL("../assets/fonts/BricolageGrotesque-800.woff", import.meta.url)),
		load(new URL("../assets/fonts/InstrumentSans-400.woff", import.meta.url)),
		load(new URL("../assets/fonts/InstrumentSans-600.woff", import.meta.url)),
	]);
	return [
		{ name: "Bricolage", data: display, weight: 800 as const, style: "normal" as const },
		{ name: "Instrument", data: regular, weight: 400 as const, style: "normal" as const },
		{ name: "Instrument", data: semibold, weight: 600 as const, style: "normal" as const },
	];
}

function BallotMark({ size, color }: { size: number; color: string }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M4 13h16v7H4z" />
			<path d="M7 13V5h10v8" />
			<path d="M10 9l1.5 1.5L14 8" />
		</svg>
	);
}

/** Face-scan illustration used on the right of most previews. */
function FaceScan() {
	return (
		<div style={{ display: "flex", position: "relative", width: 300, height: 380, borderRadius: 40, background: "#0F2A1D", alignItems: "center", justifyContent: "center", border: `2px solid ${C.line}` }}>
			<div style={{ display: "flex", width: 190, height: 250, borderRadius: 999, border: `5px dashed ${C.mint}`, alignItems: "flex-end", justifyContent: "center", overflow: "hidden" }}>
				<svg width="170" height="215" viewBox="0 0 150 190">
					<circle cx="75" cy="72" r="38" fill="#2F5A45" />
					<circle cx="62" cy="70" r="4" fill="#BBF7D0" />
					<circle cx="88" cy="70" r="4" fill="#BBF7D0" />
					<path d="M10 190c4-48 30-72 65-72s61 24 65 72z" fill="#2F5A45" />
				</svg>
			</div>
			<div style={{ display: "flex", position: "absolute", left: 50, right: 50, top: 170, height: 5, borderRadius: 5, background: C.mint, boxShadow: `0 0 24px 6px rgba(74,222,128,.55)` }} />
			<div style={{ display: "flex", position: "absolute", bottom: -22, right: -22, width: 84, height: 84, borderRadius: 999, background: "#13A35E", alignItems: "center", justifyContent: "center", border: `6px solid ${C.forest}` }}>
				<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
					<path d="M5 12.5l4.5 4.5L19 7.5" />
				</svg>
			</div>
		</div>
	);
}

/** Photos live in /images/og. Each route passes a literal URL so only its own photo is bundled. */
export const loadPhoto = (url: URL) => fetch(url).then((r) => r.arrayBuffer());

export interface OgProps {
	eyebrow: string;
	title: string;
	subtitle: string;
	/** Background photo (CC0, see images/og/CREDITS.md). */
	photo?: ArrayBuffer;
	/** Right-hand panel; defaults to the face-scan illustration when there is no photo. */
	side?: React.ReactNode;
}

function Layer({ background }: { background: string }) {
	const gradient = background.includes("gradient");
	return <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: 1200, height: 630, ...(gradient ? { backgroundImage: background } : { backgroundColor: background }) }} />;
}

function Card({ eyebrow, title, subtitle, side, photo }: OgProps) {
	const panel = side ?? (photo ? null : <FaceScan />);
	// Over photos the copy goes a shade brighter and gets a soft shadow so it never sinks into the image.
	const soft = photo ? "#E4F4E9" : C.pale;
	// Satori rejects undefined style values, so the shadow is spread in only when needed.
	const lift = photo ? { textShadow: "0 2px 18px rgba(0,0,0,0.35)" } : {};
	return (
		<div style={{ display: "flex", width: "100%", height: "100%", background: C.forest, color: C.white, fontFamily: "Instrument", position: "relative", overflow: "hidden" }}>
			{photo ? (
				<>
					{/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
					<img src={photo as unknown as string} width={1200} height={630} style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, objectFit: "cover" }} />
					{/* Layered green overlay: an even brand tint so every photo reads as one set, a deep
					    fade behind the copy, a floor for the footer and a soft mint glow for depth. */}
					<Layer background="rgba(6,61,36,0.58)" />
					<Layer background="linear-gradient(90deg, rgba(3,34,19,0.97) 0%, rgba(4,42,24,0.93) 40%, rgba(6,61,36,0.55) 68%, rgba(6,61,36,0.1) 100%)" />
					<Layer background="linear-gradient(0deg, rgba(3,34,19,0.9) 0%, rgba(3,34,19,0) 38%)" />
					<Layer background="radial-gradient(circle at 12% 18%, rgba(74,222,128,0.2) 0%, rgba(74,222,128,0) 45%)" />
					<div style={{ display: "flex", position: "absolute", top: 22, left: 22, width: 1156, height: 586, borderRadius: 30, border: "1.5px solid rgba(187,247,208,0.18)" }} />
				</>
			) : (
				/* concentric rings for depth */
				[900, 720, 540, 360].map((r) => <div key={r} style={{ display: "flex", position: "absolute", width: r, height: r, right: -r / 2 + 120, top: -r / 2 + 40, borderRadius: 999, border: "2px solid rgba(255,255,255,0.05)" }} />)
			)}
			<div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 0 56px 72px", width: 760 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
					<div style={{ display: "flex", width: 60, height: 60, borderRadius: 18, background: C.white, alignItems: "center", justifyContent: "center" }}>
						<BallotMark size={36} color={C.brand} />
					</div>
					<div style={{ display: "flex", fontFamily: "Bricolage", fontSize: 38, fontWeight: 800, letterSpacing: -1 }}>AuthVote</div>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
					<div style={{ display: "flex", alignSelf: "flex-start", alignItems: "center", gap: 12, padding: "10px 20px", borderRadius: 999, background: photo ? "rgba(3,34,19,0.7)" : "rgba(134,239,172,0.14)", border: `1.5px solid rgba(134,239,172,${photo ? 0.5 : 0})`, color: C.mint, fontSize: 24, fontWeight: 600 }}>
						<div style={{ display: "flex", width: 12, height: 12, borderRadius: 999, background: "#4ADE80" }} />
						{eyebrow}
					</div>
					<div style={{ display: "flex", fontFamily: "Bricolage", fontSize: title.length > 34 ? 62 : 74, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2.5, ...lift }}>{title}</div>
					<div style={{ display: "flex", fontSize: 28, lineHeight: 1.4, color: soft, maxWidth: 620, ...lift }}>{subtitle}</div>
				</div>
				<div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 22, color: soft, ...lift }}>
					<div style={{ display: "flex" }}>Ondo State</div>
					<div style={{ display: "flex", width: 6, height: 6, borderRadius: 999, background: C.mint }} />
					<div style={{ display: "flex" }}>Verified e-voting</div>
				</div>
			</div>
			{panel && <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", paddingRight: 40 }}>{panel}</div>}
		</div>
	);
}

export async function renderOg(props: OgProps) {
	return new ImageResponse(<Card {...props} />, { ...OG_SIZE, fonts: await fonts() });
}
