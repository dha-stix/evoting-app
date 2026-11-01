import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iOS and some link previews. */
export default function AppleIcon() {
	return new ImageResponse(
		(
			<div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#063D24" }}>
				<div style={{ display: "flex", width: 132, height: 132, alignItems: "center", justifyContent: "center", background: "#FFFFFF", borderRadius: 34 }}>
					<svg width="88" height="88" viewBox="0 0 24 24" fill="none" stroke="#0A6B3D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M4 13h16v7H4z" />
						<path d="M7 13V5h10v8" />
						<path d="M10 9l1.5 1.5L14 8" />
					</svg>
				</div>
			</div>
		),
		size,
	);
}
