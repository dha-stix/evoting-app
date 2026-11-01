"use client";
import { Eye, EyeOff, KeyRound, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { getBrowserClient } from "@/lib/supabase-browser";

type State = "checking" | "ready" | "invalid";

/** Landing page for admin invite and password-reset links. */
export function SetPasswordForm() {
	const router = useRouter();
	const params = useSearchParams();
	const supabase = getBrowserClient();
	const [state, setState] = useState<State>("checking");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [show, setShow] = useState(false);
	const [busy, setBusy] = useState(false);
	const isInvite = params.get("type") === "invite";

	useEffect(() => {
		const token_hash = params.get("token_hash");
		const type = params.get("type");
		if (!token_hash || (type !== "invite" && type !== "recovery")) {
			setState("invalid");
			return;
		}
		supabase.auth.verifyOtp({ token_hash, type }).then(({ error }) => setState(error ? "invalid" : "ready"));
	}, [params, supabase]);

	const tooShort = password.length > 0 && password.length < 12;
	const mismatch = confirm.length > 0 && confirm !== password;

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (password.length < 12 || password !== confirm) return;
		setBusy(true);
		const { error } = await supabase.auth.updateUser({ password });
		setBusy(false);
		if (error) return toast.error(error.message);
		toast.success("Password saved");
		router.replace("/admin");
		router.refresh();
	};

	if (state === "checking") return <p className="text-muted">Checking your link…</p>;

	if (state === "invalid") {
		return (
			<div className="flex flex-col gap-5">
				<span className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-danger-bg text-danger">
					<ShieldAlert className="h-7 w-7" aria-hidden />
				</span>
				<h1 className="h-display text-[32px] font-extrabold">This link has expired</h1>
				<p className="text-muted">Links work once and expire after an hour. Request a new one from the sign-in page.</p>
				<Link href="/admin/login?forgot=1" className="font-semibold text-brand hover:underline">
					Get a new link
				</Link>
			</div>
		);
	}

	return (
		<form onSubmit={submit} className="flex flex-col gap-5">
			<span className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-brand-50 text-brand">
				<KeyRound className="h-7 w-7" aria-hidden />
			</span>
			<header>
				<h1 className="h-display text-[32px] font-extrabold">{isInvite ? "Set up your account" : "Choose a new password"}</h1>
				<p className="mt-1.5 text-muted">Use at least 12 characters. A short phrase is easier to remember.</p>
			</header>
			<Field label="New password" error={tooShort ? "Use at least 12 characters" : undefined}>
				{(p) => (
					<span className="relative block">
						<Input {...p} type={show ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-14" data-autofocus />
						<button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1 top-1 inline-flex h-11 w-11 items-center justify-center text-subtle">
							{show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
						</button>
					</span>
				)}
			</Field>
			<Field label="Confirm password" error={mismatch ? "Passwords do not match" : undefined}>
				{(p) => <Input {...p} type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
			</Field>
			<Button type="submit" size="lg" loading={busy} disabled={password.length < 12 || password !== confirm} lift>
				Save password and continue
			</Button>
		</form>
	);
}
