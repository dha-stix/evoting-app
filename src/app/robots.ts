import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
	return {
		// Previews still work for private pages; they are just kept out of search results.
		rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/vote/ballot", "/verify"] },
		sitemap: `${getSiteUrl()}/sitemap.xml`,
	};
}
