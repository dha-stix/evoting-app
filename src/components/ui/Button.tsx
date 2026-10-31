import Link from "next/link";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
	primary: "bg-brand text-white hover:bg-[#095f36]",
	secondary: "border border-[#CBD5CA] bg-white text-ink hover:border-brand/50",
	light: "bg-white text-forest",
	outlineLight: "border border-white/30 text-white hover:bg-white/10",
	danger: "bg-danger-bg text-danger hover:bg-[#fde4e1]",
	solidDanger: "bg-danger text-white hover:bg-[#9b1f15]",
	ghost: "text-brand hover:bg-brand-50",
};
const sizes = {
	sm: "h-10 px-3.5 text-sm rounded-xl gap-1.5",
	md: "h-12 px-5 text-[15px] rounded-[14px] gap-2",
	lg: "h-14 px-6 text-base rounded-[14px] gap-2.5",
	icon: "h-11 w-11 rounded-xl",
};

type Common = {
	variant?: keyof typeof variants;
	size?: keyof typeof sizes;
	loading?: boolean;
	lift?: boolean;
	className?: string;
	children: React.ReactNode;
};

export const buttonClass = ({ variant = "primary", size = "md", lift, className }: Omit<Common, "children" | "loading">) =>
	cn(
		"inline-flex select-none items-center justify-center font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
		variants[variant],
		sizes[size],
		lift && "lift",
		className,
	);

export const Button = forwardRef<HTMLButtonElement, Common & React.ButtonHTMLAttributes<HTMLButtonElement>>(
	({ variant, size, loading, lift, className, children, disabled, type = "button", ...props }, ref) => (
		<button ref={ref} type={type} disabled={disabled || loading} className={buttonClass({ variant, size, lift, className })} {...props}>
			{loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
			{children}
		</button>
	),
);
Button.displayName = "Button";

export function ButtonLink({ href, variant, size, lift, className, children, ...props }: Common & { href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
	return (
		<Link href={href} className={buttonClass({ variant, size, lift, className })} {...props}>
			{children}
		</Link>
	);
}
