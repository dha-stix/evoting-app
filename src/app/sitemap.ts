import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
	const base = getSiteUrl();
	return [
		{ url: `${base}/`, changeFrequency: "weekly", priority: 1 },
		{ url: `${base}/register`, changeFrequency: "monthly", priority: 0.8 },
		{ url: `${base}/vote`, changeFrequency: "daily", priority: 0.8 },
		{ url: `${base}/results`, changeFrequency: "hourly", priority: 0.9 },
		{ url: `${base}/card`, changeFrequency: "monthly", priority: 0.6 },
	];
}
