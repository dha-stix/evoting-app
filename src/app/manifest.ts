import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/constants";
import { SITE_DESCRIPTION } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: `${SITE_NAME} · Verified e-voting`,
		short_name: SITE_NAME,
		description: SITE_DESCRIPTION,
		start_url: "/",
		display: "standalone",
		background_color: "#F5F7F2",
		theme_color: "#063D24",
		icons: [
			{ src: "/icon", sizes: "64x64", type: "image/png" },
			{ src: "/apple-icon", sizes: "180x180", type: "image/png" },
		],
	};
}
