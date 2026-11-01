import type { Metadata } from "next";
import { SITE_NAME } from "./constants";

/**
 * The site's public address. Set NEXT_PUBLIC_SITE_URL in production; on Vercel
 * it falls back to the project's production domain, then the deployment URL.
 */
export function getSiteUrl() {
	const explicit = process.env.NEXT_PUBLIC_SITE_URL;
	if (explicit) return explicit.replace(/\/$/, "");
	const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
	if (vercel) return `https://${vercel}`;
	return "http://localhost:3000";
}

/** Static preview JPEGs in public/og, rendered by `npm run render-og`. */
export type OgImage = "home" | "register" | "vote" | "card";
export const ogImage = (name: OgImage, alt = `${SITE_NAME}: verified e-voting for Ondo State`) => ({ url: `/og/${name}.jpg`, width: 1200, height: 630, alt, type: "image/jpeg" });
export const DEFAULT_OG_IMAGE = ogImage("home");

export const SITE_DESCRIPTION =
	"Verified e-voting for Ondo State. Register with your NIN and a live face scan, prove it is you on election day, cast a secret ballot and watch results update live.";

/**
 * Title, description and link-preview tags for a page. `image` picks one of the
 * static previews; `ownImage` is for pages with an opengraph-image route (results).
 */
export function pageMeta({ title, description, path, noindex, image: name = "home", ownImage }: { title: string; description: string; path: string; noindex?: boolean; image?: OgImage; ownImage?: boolean }): Metadata {
	const preview = ogImage(name, `${title} · ${SITE_NAME}`);
	const image = ownImage ? {} : { images: [preview] };
	return {
		title,
		description,
		alternates: { canonical: path },
		openGraph: { title: `${title} · ${SITE_NAME}`, description, url: path, siteName: SITE_NAME, type: "website", locale: "en_NG", ...image },
		twitter: { card: "summary_large_image", title: `${title} · ${SITE_NAME}`, description, ...(ownImage ? {} : { images: [preview.url] }) },
		...(noindex ? { robots: { index: false, follow: false } } : {}),
	};
}
