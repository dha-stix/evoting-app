import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Browser-tab icon: the AuthVote ballot mark. */
export default function Icon() {
	return new ImageResponse(
		(
			<div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#0A6B3D", borderRadius: 14 }}>
				<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
					<path d="M4 13h16v7H4z" />
					<path d="M7 13V5h10v8" />
					<path d="M10 9l1.5 1.5L14 8" />
				</svg>
			</div>
		),
		size,
	);
}
