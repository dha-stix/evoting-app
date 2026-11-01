import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { CREDIT, SITE_NAME } from "@/lib/constants";
import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, getSiteUrl } from "@/lib/site";
// Self-hosted fonts: no request to Google at build or run time.
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "@fontsource-variable/instrument-sans/index.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "@/styles/globals.css";

export const metadata: Metadata = {
	metadataBase: new URL(getSiteUrl()),
	title: { default: `${SITE_NAME} · Verified e-voting for Ondo State`, template: `%s · ${SITE_NAME}` },
	description: SITE_DESCRIPTION,
	applicationName: SITE_NAME,
	authors: [{ name: CREDIT.name, url: CREDIT.url }],
	creator: CREDIT.name,
	keywords: ["e-voting", "Ondo State", "Nigeria", "election", "face verification", "INEC", "voter card", "live results"],
	alternates: { canonical: "/" },
	// Link previews (WhatsApp, X, Facebook, LinkedIn, Slack, iMessage). Images are static JPEGs in public/og (npm run render-og).
	openGraph: { type: "website", locale: "en_NG", siteName: SITE_NAME, url: "/", title: `${SITE_NAME} · Verified e-voting for Ondo State`, description: SITE_DESCRIPTION, images: [DEFAULT_OG_IMAGE] },
	twitter: { card: "summary_large_image", title: `${SITE_NAME} · Verified e-voting for Ondo State`, description: SITE_DESCRIPTION, images: [DEFAULT_OG_IMAGE.url] },
};

export const viewport: Viewport = { themeColor: "#063D24", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				{children}
				<Toaster position="top-center" richColors closeButton toastOptions={{ className: "font-sans" }} />
			</body>
		</html>
	);
}
