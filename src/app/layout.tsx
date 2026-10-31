import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { SITE_NAME } from "@/lib/constants";
// Self-hosted fonts: no request to Google at build or run time.
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "@fontsource-variable/instrument-sans/index.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "@/styles/globals.css";

export const metadata: Metadata = {
	metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
	title: { default: `${SITE_NAME} · Verified e-voting`, template: `%s · ${SITE_NAME}` },
	description:
		"Register with your NIN and a live face scan, verify it is really you on election day, cast a secret ballot and watch results update live.",
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
