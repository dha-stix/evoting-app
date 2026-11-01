"use client";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

function useDialogBehaviour(open: boolean, onClose: () => void) {
	const panel = useRef<HTMLDivElement>(null);
	// Keep the latest onClose without re-running the effect. Parents often pass a
	// new arrow function on every render; re-running would steal focus from the
	// field being typed in.
	const close = useRef(onClose);
	close.current = onClose;
	useEffect(() => {
		if (!open) return;
		const previous = document.activeElement as HTMLElement | null;
		document.body.style.overflow = "hidden";
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") close.current();
			if (e.key === "Tab" && panel.current) {
				const items = panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])');
				if (!items.length) return;
				const first = items[0]!;
				const last = items[items.length - 1]!;
				if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
				else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
			}
		};
		document.addEventListener("keydown", onKey);
		requestAnimationFrame(() => {
			const p = panel.current;
			// On touch screens focus the panel itself, so the keyboard doesn't pop up before the user taps a field.
			if (window.matchMedia("(pointer: coarse)").matches) return p?.focus({ preventScroll: true });
			// Otherwise prefer an explicit target, then the first field; the close button only as a last resort.
			(p?.querySelector<HTMLElement>("[data-autofocus]") ?? p?.querySelector<HTMLElement>("input:not([type=hidden]):not([type=checkbox]):not([type=file]), select, textarea") ?? p?.querySelector<HTMLElement>("button"))?.focus({ preventScroll: true });
		});
		return () => {
			document.body.style.overflow = "";
			document.removeEventListener("keydown", onKey);
			previous?.focus();
		};
	}, [open]);
	return panel;
}

interface OverlayProps {
	open: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	className?: string;
	role?: "dialog" | "alertdialog";
}

/** Action row pinned to the bottom of a light drawer while its form scrolls. */
export function DrawerFooter({ children }: { children: React.ReactNode }) {
	return <div className="sticky -bottom-6 z-10 -mx-6 -mb-6 mt-auto grid grid-cols-2 gap-2.5 border-t border-line bg-white px-6 pb-6 pt-4 sm:-bottom-7 sm:-mx-7 sm:-mb-7 sm:px-7 sm:pb-7">{children}</div>;
}

export function Modal({ open, onClose, title, children, className, role = "dialog" }: OverlayProps) {
	const panel = useDialogBehaviour(open, onClose);
	return (
		<AnimatePresence>
			{open && (
				<motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-[#061E12]/55 p-4 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
					<motion.div
						ref={panel}
						role={role}
						aria-modal="true"
						aria-label={title}
						tabIndex={-1}
						className={cn("w-full max-w-[460px] rounded-[28px] bg-white p-6 outline-none sm:p-8", className)}
						initial={{ opacity: 0, y: 40, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 30, scale: 0.98 }}
						transition={{ type: "spring", stiffness: 380, damping: 32 }}
					>
						{children}
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

/** `tone` sets the panel colours, so callers never fight the default background with their own class. */
export function Drawer({ open, onClose, title, children, className, side = "right", width = 480, tone = "light" }: OverlayProps & { side?: "left" | "right"; width?: number; tone?: "light" | "dark" }) {
	const panel = useDialogBehaviour(open, onClose);
	const from = side === "right" ? "100%" : "-100%";
	return (
		<AnimatePresence>
			{open && (
				<motion.div className={cn("fixed inset-0 z-50 flex bg-[#061E12]/45", side === "right" ? "justify-end" : "justify-start")} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
					<motion.aside
						ref={panel}
						role="dialog"
						aria-modal="true"
						aria-label={title}
						tabIndex={-1}
						className={cn("flex h-full flex-col overflow-y-auto overscroll-contain outline-none", tone === "dark" ? "bg-forest p-4 text-white" : "bg-white p-6 sm:p-7", className)}
						style={{ width: `min(88vw, ${width}px)` }}
						initial={{ x: from }}
						animate={{ x: 0 }}
						exit={{ x: from }}
						transition={{ type: "spring", stiffness: 320, damping: 34 }}
					>
						{side === "right" && (
							// Stays visible while the form scrolls, so the drawer can always be closed.
							<div className="sticky -top-6 z-10 -mx-6 -mt-6 mb-5 flex items-center justify-between gap-4 border-b border-line bg-white px-6 py-4 sm:-top-7 sm:-mx-7 sm:-mt-7 sm:px-7">
								<h2 className="h-display text-2xl">{title}</h2>
								<button type="button" onClick={onClose} aria-label="Close" className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-ground hover:bg-line">
									<X className="h-5 w-5" />
								</button>
							</div>
						)}
						{children}
					</motion.aside>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
