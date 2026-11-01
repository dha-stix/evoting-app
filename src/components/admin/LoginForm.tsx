"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, MailCheck, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { OtpInput } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { requestAdminPasswordReset } from "@/lib/supabase-actions";
import { getBrowserClient } from "@/lib/supabase-browser";
import { adminLoginSchema } from "@/lib/validation";
import type { z } from "zod";

export function LoginForm() {
	const router = useRouter();
	const params = useSearchParams();
	const [step, setStep] = useState<"password" | "mfa" | "forgot" | "sent">(params.get("step") === "mfa" ? "mfa" : params.get("forgot") ? "forgot" : "password");
	const [resetEmail, setResetEmail] = useState("");
	const [showPw, setShowPw] = useState(false);
	const [code, setCode] = useState("");
	const [busy, setBusy] = useState(false);
	const form = useForm<z.input<typeof adminLoginSchema>>({ resolver: zodResolver(adminLoginSchema) });
	const supabase = getBrowserClient();

	useEffect(() => {
		if (params.get("error") === "not-admin") {
			supabase.auth.signOut();
			toast.error("That account is not an AuthVote admin.");
		}
	}, [params, supabase]);

	const finish = () => {
		router.replace("/admin");
		router.refresh();
	};

	const onPassword = form.handleSubmit(async ({ email, password }) => {
		setBusy(true);
		const { error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) {
			setBusy(false);
			return toast.error(error.message === "Invalid login credentials" ? "Wrong email or password." : error.message);
		}
		const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
		setBusy(false);
		if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") return setStep("mfa");
		finish();
	});

	const onCode = async () => {
		setBusy(true);
		const { data: factors } = await supabase.auth.mfa.listFactors();
		const totp = factors?.totp.find((f) => f.status === "verified");
		if (!totp) {
			setBusy(false);
			return toast.error("No authenticator is set up for this account.");
		}
		const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: totp.id, code });
		setBusy(false);
		if (error) {
			setCode("");
			return toast.error("That code is not right. Try the current one from your app.");
		}
		finish();
	};

	return (
		<AnimatePresence mode="wait">
			{step === "password" ? (
				<motion.form key="pw" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} onSubmit={onPassword} noValidate className="flex flex-col gap-5">
					<header>
						<h1 className="h-display text-[32px] font-extrabold">Admin sign-in</h1>
						<p className="mt-1.5 text-muted">Use the email your super admin invited.</p>
					</header>
					<Field label="Email" error={form.formState.errors.email?.message}>{(p) => <Input {...p} type="email" autoComplete="username" {...form.register("email")} />}</Field>
					<Field label="Password" error={form.formState.errors.password?.message}>
						{(p) => (
							<span className="relative block">
								<Input {...p} type={showPw ? "text" : "password"} autoComplete="current-password" className="pr-14" {...form.register("password")} />
								<button type="button" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? "Hide password" : "Show password"} className="absolute right-1 top-1 inline-flex h-11 w-11 items-center justify-center text-subtle">
									{showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
								</button>
							</span>
						)}
					</Field>
					<button type="button" onClick={() => (setResetEmail(form.getValues("email") ?? ""), setStep("forgot"))} className="-mt-2 self-end text-sm font-semibold text-brand hover:underline">
						Forgot password?
					</button>
					<Button type="submit" size="lg" loading={busy} lift>
						Continue
					</Button>
					<Link href="/" className="text-center text-sm font-medium text-brand hover:underline">
						Back to the public site
					</Link>
				</motion.form>
			) : step === "forgot" ? (
				<motion.form
					key="forgot"
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -12 }}
					onSubmit={async (e) => {
						e.preventDefault();
						setBusy(true);
						const res = await requestAdminPasswordReset(resetEmail);
						setBusy(false);
						if (!res.ok) return toast.error(res.error);
						setStep("sent");
					}}
					className="flex flex-col gap-5"
				>
					<header>
						<h1 className="h-display text-[32px] font-extrabold">Reset your password</h1>
						<p className="mt-1.5 text-muted">Enter your admin email and we will send you a link to choose a new password.</p>
					</header>
					<Field label="Email">{(p) => <Input {...p} type="email" autoComplete="username" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} data-autofocus />}</Field>
					<Button type="submit" size="lg" loading={busy} lift>
						Send reset link
					</Button>
					<button type="button" onClick={() => setStep("password")} className="min-h-11 font-semibold text-brand">
						Back to sign-in
					</button>
				</motion.form>
			) : step === "sent" ? (
				<motion.div key="sent" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="flex flex-col gap-5">
					<span className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-brand-50 text-brand">
						<MailCheck className="h-7 w-7" aria-hidden />
					</span>
					<h1 className="h-display text-[32px] font-extrabold">Check your email</h1>
					<p className="text-muted">If <b>{resetEmail}</b> belongs to an admin, a link to set a new password is on its way. It expires in 1 hour.</p>
					<button type="button" onClick={() => setStep("password")} className="min-h-11 self-start font-semibold text-brand">
						Back to sign-in
					</button>
				</motion.div>
			) : (
				<motion.form key="mfa" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} onSubmit={(e) => (e.preventDefault(), onCode())} className="flex flex-col gap-5">
					<span className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-brand-50 text-brand">
						<Smartphone className="h-7 w-7" strokeWidth={1.8} aria-hidden />
					</span>
					<header>
						<h1 className="h-display text-[32px] font-extrabold">Two-step check</h1>
						<p className="mt-1.5 text-muted">Enter the 6-digit code from your authenticator app.</p>
					</header>
					<OtpInput value={code} onChange={setCode} disabled={busy} />
					<Button type="submit" size="lg" loading={busy} disabled={code.length !== 6} lift>
						Sign in
					</Button>
					<button
						type="button"
						onClick={async () => {
							await supabase.auth.signOut();
							setStep("password");
						}}
						className="min-h-11 font-semibold text-brand"
					>
						Use a different account
					</button>
				</motion.form>
			)}
		</AnimatePresence>
	);
}
