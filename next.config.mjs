/** @type {import('next').NextConfig} */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
	? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
	: "localhost";

const nextConfig = {
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
		],
	},
	experimental: {
		// Face frames are sent to server actions as compressed JPEG data URLs.
		serverActions: { bodySizeLimit: "4mb" },
	},
	async redirects() {
		return [
			{ source: "/vote/register", destination: "/register", permanent: true },
			{ source: "/vote/login", destination: "/vote", permanent: true },
			{ source: "/vote/card", destination: "/card", permanent: true },
			{ source: "/vote/count", destination: "/results", permanent: true },
			{ source: "/admin/dashboard", destination: "/admin", permanent: true },
			{ source: "/admin/users", destination: "/admin/team", permanent: true },
		];
	},
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{ key: "X-Frame-Options", value: "DENY" },
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
					{ key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
				],
			},
		];
	},
};

export default nextConfig;
