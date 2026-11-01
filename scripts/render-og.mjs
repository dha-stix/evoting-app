// Renders the static link-preview images into public/og as small JPEGs, using
// the dev-only designs in src/app/og-source/[name]/route.dev.tsx.
//   npm run dev        (in another terminal)
//   npm run render-og
// Large PNGs often do not show on WhatsApp, so the photo previews are saved as
// ~150 KB JPEGs. The live results preview is generated on request instead.

import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const base = process.env.OG_SOURCE_URL ?? "http://localhost:3000";
await mkdir("public/og", { recursive: true });
for (const name of ["home", "register", "vote", "card"]) {
	const res = await fetch(`${base}/og-source/${name}`);
	if (!res.ok) throw new Error(`${name}: ${res.status}. Is npm run dev running?`);
	const jpeg = await sharp(Buffer.from(await res.arrayBuffer())).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
	await writeFile(`public/og/${name}.jpg`, jpeg);
	console.log(`public/og/${name}.jpg  ${Math.round(jpeg.length / 1024)} KB`);
}
