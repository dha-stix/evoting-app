"use client";
import { KeyRound, Mail, ShieldCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { OtpInput, Pill } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Overlay";
import { ADMIN_ROLE_LABEL } from "@/lib/constants";
import { inviteAdmin, removeAdmin, updateAdminRole } from "@/lib/supabase-actions";
import { getBrowserClient } from "@/lib/supabase-browser";
import { formatDateTime, initials } from "@/lib/utils";
import type { Admin, AdminRole, AuditEntry } from "@/types";
import { PageHeader } from "./AdminShell";
import { describe } from "./OverviewWidgets";

const HUES = ["#CFE9D8", "#FDE7C7", "#DBE5FF", "#EBDDFB"];

export function TeamManager({ me, admins, audit }: { me: Admin; admins: Admin[]; audit: AuditEntry[] }) {
	const router = useRouter();
	const [inviting, setInviting] = useState(false);
	const isSuper = me.role === "super_admin";

	const changeRole = async (id: string, role: AdminRole) => {
		const res = await updateAdminRole(id, role);
		if (!res.ok) return toast.error(res.error);
		toast.success("Role updated");
		router.refresh();
	};

	const remove = async (a: Admin) => {
		if (!confirm(`Remove ${a.full_name} from the team? They will lose access immediately.`)) return;
		const res = await removeAdmin(a.id);
		if (!res.ok) return toast.error(res.error);
		toast.success("Admin removed");
		router.refresh();
	};

	return (
		<>
			<PageHeader
				title="Admins & audit log"
				sub="Who can manage elections, and everything they have done."
				icon={ShieldCheck}
				actions={
					isSuper && (
						<Button size="sm" className="h-11" onClick={() => setInviting(true)} lift>
							<Mail className="h-[18px] w-[18px]" aria-hidden /> Invite admin
						</Button>
					)
				}
			/>
			<div className="flex flex-wrap items-start gap-5">
				<div className="flex min-w-0 flex-[1.2_1_420px] flex-col gap-5">
					<section className="card overflow-hidden rounded-3xl">
						<h2 className="h-display border-b border-[#EEF2ED] px-[22px] py-5 text-xl">Team</h2>
						<ul>
							{admins.map((a, i) => (
								<li key={a.id} className="flex flex-wrap items-center gap-3.5 border-b border-[#EEF2ED] px-[22px] py-4 last:border-0">
									<span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold" style={{ background: HUES[i % 4] }}>{initials(a.full_name)}</span>
									<span className="flex min-w-0 flex-[1_1_180px] flex-col">
										<b className="truncate">
											{a.full_name} {a.id === me.id && <span className="font-normal text-subtle">(you)</span>}
										</b>
										<span className="truncate text-[13px] text-subtle">{a.email}</span>
									</span>
									{isSuper && a.id !== me.id ? (
										<>
											<Select aria-label={`Role for ${a.full_name}`} value={a.role} onChange={(e) => changeRole(a.id, e.target.value as AdminRole)} className="h-10 w-auto text-sm">
												{Object.entries(ADMIN_ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
											</Select>
											<button type="button" onClick={() => remove(a)} aria-label={`Remove ${a.full_name}`} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-danger hover:bg-danger-bg">
												<Trash2 className="h-[18px] w-[18px]" />
											</button>
										</>
									) : (
										<Pill tone={a.role === "super_admin" ? "dark" : a.role === "officer" ? "green" : "grey"}>{ADMIN_ROLE_LABEL[a.role]}</Pill>
									)}
								</li>
							))}
						</ul>
						<div className="grid gap-2.5 bg-[#F8FAF7] px-[22px] py-4 text-[13px] text-muted sm:grid-cols-3">
							<span><b className="text-ink">Super admin</b> · everything, including the team</span>
							<span><b className="text-ink">Election officer</b> · elections, candidates, parties, voters</span>
							<span><b className="text-ink">Observer</b> · read-only</span>
						</div>
					</section>
					<TwoStepCard />
				</div>

				<section className="card flex flex-[1_1_340px] flex-col gap-3.5 rounded-3xl p-[22px]">
					<div className="flex items-baseline justify-between">
						<h2 className="h-display text-xl">Audit log</h2>
						<span className="text-[13px] text-subtle">Latest 40</span>
					</div>
					{audit.length === 0 ? (
						<p className="text-muted">No activity yet.</p>
					) : (
						<ol className="flex flex-col">
							{audit.map((e, i) => (
								<li key={e.id} className="relative flex gap-3.5 pb-4 last:pb-0">
									{i < audit.length - 1 && <span aria-hidden className="absolute bottom-0 left-[5px] top-5 w-0.5 bg-line" />}
									<span className="relative z-[1] mt-1.5 h-3 w-3 shrink-0 rounded-full bg-brand-500 ring-4 ring-white" />
									<span className="flex min-w-0 flex-col gap-0.5">
										<span className="text-[15px]">{describe(e)}</span>
										<span className="text-[13px] text-subtle">{formatDateTime(e.created_at)}</span>
									</span>
								</li>
							))}
						</ol>
					)}
				</section>
			</div>

			<Modal open={inviting} onClose={() => setInviting(false)} title="Invite admin">
				<InviteForm onDone={() => (setInviting(false), router.refresh())} onCancel={() => setInviting(false)} />
			</Modal>
		</>
	);
}

function InviteForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	return (
		<form
			className="flex flex-col gap-[18px]"
			onSubmit={async (e) => {
				e.preventDefault();
				const fd = new FormData(e.currentTarget);
				setBusy(true);
				const res = await inviteAdmin({ full_name: String(fd.get("full_name")), email: String(fd.get("email")), role: fd.get("role") as AdminRole });
				setBusy(false);
				if (!res.ok) return setError(res.error);
				toast.success("Invite sent");
				onDone();
			}}
		>
			<h2 className="h-display text-2xl font-extrabold">Invite an admin</h2>
			<p className="text-muted">They get an email to set a password, then sign in at /admin.</p>
			<Field label="Full name">{(p) => <Input {...p} name="full_name" required data-autofocus />}</Field>
			<Field label="Work email">{(p) => <Input {...p} name="email" type="email" required />}</Field>
			<Field label="Role">
				{(p) => (
					<Select {...p} name="role" defaultValue="officer">
						{Object.entries(ADMIN_ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
					</Select>
				)}
			</Field>
			{error && <p role="alert" className="rounded-xl bg-danger-bg p-3 text-sm text-danger">{error}</p>}
			<div className="grid grid-cols-2 gap-2.5">
				<Button variant="secondary" onClick={onCancel}>Cancel</Button>
				<Button type="submit" loading={busy}>Send invite</Button>
			</div>
		</form>
	);
}

/** Lets the signed-in admin turn on an authenticator app (TOTP) for their own account. */
function TwoStepCard() {
	const supabase = getBrowserClient();
	const [enabled, setEnabled] = useState<boolean | null>(null);
	const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
	const [code, setCode] = useState("");
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		supabase.auth.mfa.listFactors().then(({ data }) => setEnabled(Boolean(data?.totp.some((f) => f.status === "verified"))));
	}, [supabase]);

	const start = async () => {
		setBusy(true);
		const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `AuthVote ${new Date().toISOString().slice(0, 10)}` });
		setBusy(false);
		if (error || !data) return toast.error(error?.message ?? "Could not start set-up.");
		setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
	};

	const verify = async () => {
		if (!enroll) return;
		setBusy(true);
		const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enroll.id, code });
		setBusy(false);
		if (error) return toast.error("That code is not right. Try the current one.");
		toast.success("Two-step sign-in is on");
		setEnroll(null);
		setEnabled(true);
	};

	return (
		<section className="card flex flex-col gap-4 rounded-3xl p-[22px]">
			<div className="flex items-center gap-3.5">
				<span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand">
					<KeyRound className="h-[22px] w-[22px]" aria-hidden />
				</span>
				<div className="flex-1">
					<h2 className="font-semibold">Two-step sign-in</h2>
					<p className="text-sm text-subtle">Ask for a code from an authenticator app every time you sign in.</p>
				</div>
				{enabled ? <Pill>On</Pill> : enabled === false && !enroll && <Button size="sm" onClick={start} loading={busy}>Turn on</Button>}
			</div>
			{enroll && (
				<div className="flex flex-wrap items-center gap-5 rounded-2xl bg-ground p-4">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={enroll.qr} alt="QR code for your authenticator app" className="h-40 w-40 rounded-xl bg-white p-2" />
					<div className="flex min-w-0 flex-[1_1_220px] flex-col gap-3">
						<p className="text-sm text-muted">
							Scan with Google Authenticator, 1Password or similar. Or enter <span className="break-all font-mono text-ink">{enroll.secret}</span>
						</p>
						<OtpInput value={code} onChange={setCode} disabled={busy} />
						<Button onClick={verify} loading={busy} disabled={code.length !== 6}>
							Confirm
						</Button>
					</div>
				</div>
			)}
		</section>
	);
}
