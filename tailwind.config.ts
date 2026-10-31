import type { Config } from "tailwindcss";

const config: Config = {
	content: ["./src/**/*.{ts,tsx}"],
	theme: {
		extend: {
			colors: {
				forest: "#063D24",
				brand: { DEFAULT: "#0A6B3D", 50: "#E8F5EC", 100: "#CFE9D8", 300: "#86CFA3", 500: "#13A35E", 700: "#0A6B3D", 900: "#063D24" },
				ink: "#0D1B14",
				muted: "#44544B",
				subtle: "#5B6B62",
				ground: "#F5F7F2",
				line: "#E2E8E1",
				warn: { DEFAULT: "#8A5300", bg: "#FFF7E8" },
				danger: { DEFAULT: "#B42318", bg: "#FEF3F2" },
			},
			fontFamily: {
				display: ["'Bricolage Grotesque Variable'", "system-ui", "sans-serif"],
				sans: ["'Instrument Sans Variable'", "system-ui", "sans-serif"],
				mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
			},
			borderRadius: { "4xl": "2rem" },
			boxShadow: {
				lift: "0 18px 36px -18px rgba(6,61,36,.45)",
				card: "0 30px 60px -40px rgba(6,61,36,.35)",
			},
			keyframes: {
				rise: { from: { opacity: "0", transform: "translateY(18px)" }, to: { opacity: "1", transform: "none" } },
				pop: { from: { opacity: "0", transform: "scale(.6)" }, to: { opacity: "1", transform: "none" } },
				pulseRing: { "0%": { boxShadow: "0 0 0 0 rgba(19,163,94,.55)" }, "100%": { boxShadow: "0 0 0 10px rgba(19,163,94,0)" } },
				float: { "50%": { transform: "translateY(-10px)" } },
				scan: { "0%,100%": { top: "12%" }, "50%": { top: "84%" } },
				marquee: { to: { transform: "translateX(-50%)" } },
				shake: { "20%,60%": { transform: "translateX(-8px)" }, "40%,80%": { transform: "translateX(8px)" } },
				draw: { to: { strokeDashoffset: "0" } },
				blink: { "0%,92%,100%": { transform: "scaleY(1)" }, "95%": { transform: "scaleY(.1)" } },
				drop: { "0%": { transform: "translateY(-7px)", opacity: "0" }, "30%": { opacity: "1" }, "70%,100%": { transform: "translateY(4px)", opacity: "0" } },
				grow: { from: { transform: "scaleX(0)" } },
				growUp: { from: { transform: "scaleY(0)" } },
			},
			animation: {
				rise: "rise .7s cubic-bezier(.2,.7,.2,1) both",
				pop: "pop .6s cubic-bezier(.2,1.4,.4,1) both",
				live: "pulseRing 1.6s ease-out infinite",
				float: "float 5s ease-in-out infinite",
				"float-slow": "float 6s ease-in-out -2s infinite",
				scan: "scan 2.4s ease-in-out infinite",
				marquee: "marquee 38s linear infinite",
				shake: "shake .5s ease both",
				draw: "draw 1.8s cubic-bezier(.4,0,.2,1) forwards .2s",
				blink: "blink 4s infinite",
				drop: "drop 2.4s cubic-bezier(.5,0,.3,1) infinite",
				grow: "grow 1.4s cubic-bezier(.2,.7,.2,1) both .4s",
				"grow-up": "growUp 1s cubic-bezier(.2,.7,.2,1) both",
			},
		},
	},
	plugins: [],
};
export default config;
